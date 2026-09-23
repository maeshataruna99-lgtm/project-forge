import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { strToU8, zipSync } from 'fflate';
import type { ProjectConfig } from '@project-forge/contracts';
import { assertSafeArchivePath, GenerationError, resolveGeneration } from './plan';
export { assertSafeArchivePath, ConfigurationError, createPlan, GenerationError } from './plan';
export type { GenerationPlan } from './plan';

const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../templates/typescript-nest-vue');
const MAX_ARCHIVE_BYTES = 2_000_000;
const MAX_SOURCE_BYTES = 2_000_000;
const MAX_GENERATION_MS = 5_000;
const ARCHIVE_MTIME = new Date('1980-01-01T00:00:00.000Z');

function readTemplate(path: string): string {
  try {
    const root = realpathSync(templateRoot);
    const requested = resolve(root, path);
    const actual = realpathSync(requested);
    const inside = relative(root, actual);
    if (!inside || inside.startsWith('..' + sep) || inside === '..' || isAbsolute(inside) || !lstatSync(requested).isFile()) throw new GenerationError();
    return readFileSync(actual, 'utf8');
  } catch {
    throw new GenerationError();
  }
}

function render(source: string, config: ProjectConfig): string {
  const auth = config.features.auth || config.project.profile === 'enterprise';
  const authSchema = auth ? `
enum CompanyRole {
  MEMBER
  ADMIN
}

model User {
  id           String              @id @default(cuid())
  email        String              @unique
  passwordHash String
  memberships  CompanyMembership[]
}

model CompanyMembership {
  id        String      @id @default(cuid())
  userId    String
  companyId String
  role      CompanyRole @default(MEMBER)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  company  Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
  @@index([companyId])
}
` : '';
  const rbacSchema = config.features.rbac ? `
model Permission {
  id          String           @id @default(cuid())
  code        String           @unique
  description String
  roles       RolePermission[]
}

model RolePermission {
  id           String      @id @default(cuid())
  role         CompanyRole
  permissionId String
  permission   Permission  @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([role, permissionId])
}
` : '';
  const navigationSchema = config.features.navigation === 'dynamic' ? `
model NavigationItem {
  id                 String   @id @default(cuid())
  key                String   @unique
  label              String
  href               String
  requiredPermission String
  sortOrder          Int      @default(0)
}
` : '';
  const auditSchema = config.features.audit ? `
model AuditEvent {
  id          String   @id @default(cuid())
  companyId   String
  actorUserId String
  action      String
  targetType  String
  targetId    String?
  metadata    Json
  createdAt   DateTime @default(now())
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId, createdAt])
  @@index([actorUserId, createdAt])
}
` : '';
  const featureImports = [
    ...(config.features.rbac ? ["import { RbacModule } from './rbac/rbac.module';"] : []),
    ...(config.features.navigation === 'dynamic' ? ["import { NavigationModule } from './navigation/navigation.module';"] : []),
    ...(config.features.audit ? ["import { AuditModule } from './audit/audit.module';"] : []),
  ].join('\n');
  const featureModules = [
    ...(config.features.rbac ? ['RbacModule'] : []),
    ...(config.features.navigation === 'dynamic' ? ['NavigationModule'] : []),
    ...(config.features.audit ? ['AuditModule'] : []),
  ].join(', ');
  const rbacReadme = config.features.rbac ? `
## Role based permissions

The API protects project reads and writes with server side permission guards. Members can read projects; company administrators can also write projects, manage members and settings, and read audit events. Re-run pnpm db:seed safely to upsert the permission and role mappings.
` : '';
  const auditReadme = config.features.audit ? `
## Audit trail

Successful authenticated write requests create company-scoped audit events. Metadata is bounded and credential fields are redacted before storage. The audit endpoint requires the audit:read permission.
` : '';
  const seedCommand = config.features.rbac ? 'node prisma/seed.mjs' : 'echo No RBAC seed data selected';
  const seedNavigation = config.features.navigation === 'dynamic' ? 'true' : 'false';
  const authFrontendImport = auth ? "import StarterAuth from './components/StarterAuth.vue';" : '';
  const authFrontendUi = auth ? '<StarterAuth />' : '';
  const navItems = config.features.navigation === 'dynamic'
    ? '<nav aria-label="Your available sections"><a v-for="item in navigation" :key="item.key" :href="item.href">{{ item.label }}</a></nav>'
    : '';
  const navigationFetch = config.features.navigation === 'dynamic'
    ? "const menu = await fetch('/api/navigation', { headers: { Authorization: `Bearer ${result.accessToken}` } }); if (menu.ok) navigation.value = await menu.json() as NavigationItem[];"
    : '';
  const authReadme = auth ? `
## Authentication and company scope

This profile includes company registration, salted scrypt password hashing, 15-minute HMAC-signed access tokens, seven-day refresh tokens, and a bearer-token guard. Set a private random AUTH_SECRET of at least 32 characters before starting the API. Never commit .env. Use POST /auth/register to create a company administrator, then POST /auth/login with an email, password, and optional company ID. POST /auth/refresh renews the token pair; refresh tokens are stateless and remain valid until expiry, so clients must discard them on logout. Protected routes receive identity from the verified access token. Company queries must use CompanyService.where(identity) or scopedQuery(identity, filters); a client-supplied company ID is checked against the signed identity.
` : '';
  return source
    .replaceAll('__PROJECT_NAME__', config.project.name)
    .replaceAll('__PRIMARY_COLOR__', config.theme.primary)
    .replaceAll('__ACCENT_COLOR__', config.theme.accent)
    .replaceAll('__THEME_MODE__', config.theme.mode)
    .replaceAll('__PROFILE_LABEL__', config.project.profile === 'enterprise' ? 'Enterprise' : 'Minimal')
    .replaceAll('/*__AUTH_FRONTEND_IMPORT__*/', authFrontendImport)
    .replaceAll('/*__AUTH_FRONTEND_SETUP__*/', '')
    .replaceAll('<!--__AUTH_FRONTEND_UI__-->', authFrontendUi)
    .replaceAll('<!--__NAVIGATION_ITEMS__-->', navItems)
    .replaceAll('/*__NAVIGATION_FETCH__*/', navigationFetch)
    .replaceAll('/*__AUTH_IMPORT__*/', auth ? "import { AuthModule } from './auth/auth.module';" : '')
    .replaceAll('/*__AUTH_MODULE__*/', auth ? 'AuthModule' : '')
    .replaceAll('/*__FEATURE_IMPORTS__*/', featureImports)
    .replaceAll('/*__FEATURE_MODULES__*/', featureModules ? `, ${featureModules}` : '')
    .replaceAll('/*__AUTH_SECRET__*/', auth ? 'AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters' : '')
    .replaceAll('/*__AUTH_PRISMA_SCHEMA__*/', `${authSchema}${rbacSchema}${navigationSchema}${auditSchema}`)
    .replaceAll('  /*__AUDIT_COMPANY_RELATION__*/', config.features.audit ? '  auditEvents AuditEvent[]' : '')
    .replaceAll('__SEED_COMMAND__', seedCommand)
    .replaceAll('__SEED_NAVIGATION__', seedNavigation)
    .replaceAll('/*__AUTH_README__*/', authReadme)
    .replaceAll('/*__RBAC_README__*/', rbacReadme)
    .replaceAll('/*__AUDIT_README__*/', auditReadme);
}

function prepareFiles(input: unknown): Record<string, Uint8Array> {
  const { config, plan, baseFiles, featureFiles } = resolveGeneration(input);
  const sources = new Map([...baseFiles, ...featureFiles].map(file => [file.destination, file.source]));
  const files: Record<string, Uint8Array> = {};
  let totalBytes = 0;
  for (const path of plan.files) {
    const sourcePath = sources.get(path) ?? path;
    const content = strToU8(render(readTemplate(sourcePath), config));
    totalBytes += content.length;
    if (totalBytes > MAX_SOURCE_BYTES) throw new GenerationError();
    const archivePath = `${plan.projectName}/${path}`;
    assertSafeArchivePath(archivePath);
    files[archivePath] = content;
  }
  return files;
}

export function createArchive(input: unknown): Uint8Array {
  const archive = zipSync(prepareFiles(input), { level: 6, mtime: ARCHIVE_MTIME });
  if (archive.length > MAX_ARCHIVE_BYTES) throw new GenerationError();
  return archive;
}

export function createArchiveAsync(input: unknown): Promise<Uint8Array> {
  const files = prepareFiles(input);
  return new Promise((resolveArchive, rejectArchive) => {
    const worker = new Worker(resolve(dirname(fileURLToPath(import.meta.url)), 'zip-worker.cjs'));
    let settled = false;
    const finish = (archive?: Uint8Array) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();
      if (!archive || archive.length > MAX_ARCHIVE_BYTES) rejectArchive(new GenerationError());
      else resolveArchive(archive);
    };
    const timeout = setTimeout(() => finish(), MAX_GENERATION_MS);
    worker.once('message', (message: { archive?: Uint8Array }) => finish(message.archive));
    worker.once('error', () => finish());
    worker.once('exit', code => {
      if (code !== 0) finish();
    });
    worker.postMessage(files);
  });
}
