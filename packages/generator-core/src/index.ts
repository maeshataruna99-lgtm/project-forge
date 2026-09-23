import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { strToU8, zipSync } from 'fflate';
import type { ProjectConfig } from '@project-forge/contracts';
import { resolveThemeTokens } from '@project-forge/contracts';
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
  const themeTokens = resolveThemeTokens(config.theme);
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
  const integrationImports = [
    ...(config.features.apiDocs ? ["import { configureApiDocs } from './api-docs/setup';"] : []),
    ...(config.features.logging ? ["import { StructuredLogger } from './logging/structured-logger';"] : []),
    ...(config.features.rateLimit ? ["import { ApiRateLimitGuard } from './rate-limit/api-rate-limit.guard';"] : []),
    ...(config.features.redis ? ["import { RedisModule } from './redis/redis.module';"] : []),
    ...(config.features.queue ? ["import { QueueModule } from './queue/queue.module';"] : []),
    ...(config.features.realtime ? ["import { RealtimeModule } from './realtime/realtime.module';"] : []),
    ...(config.features.smtp ? ["import { EmailModule } from './email/email.module';"] : []),
    ...(config.features.uploads ? ["import { UploadsModule } from './uploads/uploads.module';"] : []),
  ].join('\n');
  const integrationModules = [
    ...(config.features.redis ? ['RedisModule'] : []), ...(config.features.queue ? ['QueueModule'] : []),
    ...(config.features.realtime ? ['RealtimeModule'] : []), ...(config.features.smtp ? ['EmailModule'] : []),
    ...(config.features.uploads ? ['UploadsModule'] : []),
  ].join(', ');
  const optionalDependencies = [
    ...(config.features.redis ? ['"ioredis": "^5.4.2"'] : []),
    ...(config.features.realtime ? ['"@nestjs/websockets": "^11.1.0"', '"@nestjs/platform-socket.io": "^11.1.0"', '"socket.io": "^4.8.1"'] : []),
    ...(config.features.apiDocs ? ['"@nestjs/swagger": "^11.2.0"'] : []),
    ...(config.features.smtp ? ['"nodemailer": "^6.10.0"'] : []),
  ];
  const optionalDevDependencies: string[] = [];
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
  const ecommerce = config.project.blueprint === 'ecommerce';
  const ecommercePermissionCodes = ecommerce ? "['products:read', 'products:manage']" : '[]';
  const ecommerceMemberGrants = ecommerce ? ", 'products:read'" : '';
  const ecommerceAdminGrants = ecommerce ? ", 'products:read', 'products:manage'" : '';
  const ecommerceSeedPermissions = ecommerce ? "[['products:read', 'Read product catalog'], ['products:manage', 'Manage products']]" : '[]';
  const ecommerceSeedNavigation = ecommerce ? "[['products', 'Products', '/products', 'products:read', 15]]" : '[]';
  const optionalReadme = [
    ...(config.features.redis ? ['Redis connects through REDIS_URL. Queue jobs are stored in a Redis list; a worker/consumer still needs to be implemented for processing.'] : []),
    ...(config.features.realtime ? ['Realtime exposes a small WebSocket ping/pong example. Set WEB_ORIGIN to the allowed browser origin in production.'] : []),
    ...(config.features.apiDocs ? ['OpenAPI docs are available at /docs. Review and restrict the endpoint before exposing sensitive APIs publicly.'] : []),
    ...(config.features.smtp ? ['SMTP sends text email only after SMTP_HOST and the optional credentials are configured.'] : []),
    ...(config.features.uploads ? ['Uploads keeps validated PNG, JPEG, and PDF files in memory for the request only; no permanent storage is configured.'] : []),
    ...(config.features.rateLimit ? ['The API uses an in-memory per-process rate limit; use a shared store before horizontally scaling.'] : []),
    ...(config.features.logging ? ['The structured logger redacts common credential fields from string and JSON messages.'] : []),
    ...(config.features.generatedTests ? ['A generated feature test is included with the API test suite.'] : []),
    ...(config.features.ciCd ? ['GitHub Actions runs install, build, and test checks for pushes and pull requests.'] : []),
  ];
  const optionalApiEnv = [
    ...(config.features.redis ? ['REDIS_URL=redis://localhost:6379'] : []),
    ...(config.features.realtime ? ['WEB_ORIGIN=http://localhost:5173'] : []),
    ...(config.features.smtp ? ['SMTP_HOST=', 'SMTP_PORT=587', 'SMTP_SECURE=false', 'SMTP_USER=', 'SMTP_PASSWORD=', 'SMTP_FROM=noreply@example.invalid'] : []),
  ].join('\n');
  const dockerReadme = config.features.docker || config.deploymentProfile === 'docker'
    ? `\n## Docker\n\n${config.stack.database === 'postgresql' ? 'Copy `.env.example` to `.env`. For the generated compose stack, set DATABASE_URL to use host `postgres` and set POSTGRES_PASSWORD. ' : 'Copy `.env.example` to `.env` when the file is included for selected integrations. ' }Run \`docker compose up --build\`; the API is exposed on port 3000 and, when present, the frontend on port 8080. ${config.stack.database === 'postgresql' ? 'For local development, initialize the database with `docker compose exec api pnpm db:migrate`.' : ''} Never commit \`.env\`.\n`
    : '';
  const databaseReadme = config.stack.database === 'postgresql'
    ? `## Requirements

- Node.js 22.12 or newer
- pnpm 9
- PostgreSQL for migrations and database-backed features

## Setup

1. Copy \`.env.example\` to \`.env\` and enter your own PostgreSQL connection values.
2. Run \`pnpm install\`.
3. Run \`pnpm db:generate\`.
4. Run \`pnpm db:migrate\` against a development PostgreSQL database.
5. Run \`pnpm dev\` to start API and frontend. API health: \`http://localhost:3000/health\`; frontend: \`http://localhost:5173\`.

\`db:migrate\` uses Prisma's development migration command and needs a running PostgreSQL service. The health route and frontend can run without a database connection, but database features need the migration first.`
    : `## Requirements

- Node.js 22.12 or newer
- pnpm 9

## Setup

Run \`pnpm install\` and \`pnpm dev\` to start the API and frontend. No database or persistent storage is configured in this project.
`;
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
    .replaceAll('Blank fullstack starter', ecommerce ? 'E-commerce fullstack starter' : 'Blank fullstack starter')
    .replaceAll('__PRIMARY_COLOR__', config.theme.primary)
    .replaceAll('__ACCENT_COLOR__', config.theme.accent)
    .replaceAll('__THEME_MODE__', config.theme.mode)
    .replaceAll('__BACKGROUND_COLOR__', themeTokens.background)
    .replaceAll('__SURFACE_COLOR__', themeTokens.surface)
    .replaceAll('__TEXT_COLOR__', themeTokens.text)
    .replaceAll('__RADIUS__', themeTokens.radius)
    .replaceAll('__SHADOW__', themeTokens.shadow)
    .replaceAll('__DENSITY_GAP__', themeTokens.densityGap)
    .replaceAll('__PROFILE_LABEL__', config.project.profile === 'enterprise' ? 'Enterprise' : 'Minimal')
    .replaceAll('/*__BLUEPRINT_README__*/', ecommerce ? '\n## E-commerce starter\n\nThe product API serves an in-memory sample catalog that resets when the API restarts. The schema includes a Product model to guide a persistent implementation. This is a ready-to-extend catalog scaffold, not a checkout, payment, inventory, or order system.\n' : '')
    .replaceAll('/*__DATABASE_README__*/', databaseReadme)
    .replaceAll('/*__OPTIONAL_README__*/', `${optionalReadme.length ? `\n## Optional integrations\n\n${optionalReadme.map(line => `- ${line}`).join('\n')}\n` : ''}${dockerReadme}`)
    .replaceAll('/*__BLUEPRINT_IMPORT__*/', ecommerce ? "import { ProductsModule } from './products/products.module';" : '')
    .replaceAll('/*__BLUEPRINT_MODULE__*/', ecommerce ? ', ProductsModule' : '')
    .replaceAll('/*__INTEGRATION_IMPORTS__*/', integrationImports)
    .replaceAll('/*__INTEGRATION_MODULES__*/', integrationModules ? `, ${integrationModules}` : '')
    .replaceAll('/*__API_DOCS_BOOTSTRAP__*/', config.features.apiDocs ? "  configureApiDocs(app);" : '')
    .replaceAll('/*__LOGGER_BOOTSTRAP__*/', config.features.logging ? '  app.useLogger(new StructuredLogger());' : '')
    .replaceAll('/*__RATE_LIMIT_BOOTSTRAP__*/', config.features.rateLimit ? '  app.useGlobalGuards(new ApiRateLimitGuard());' : '')
    .replaceAll('/*__API_DOCS_IMPORT__*/', config.features.apiDocs ? "import { configureApiDocs } from './api-docs/setup';" : '')
    .replaceAll('/*__LOGGER_IMPORT__*/', config.features.logging ? "import { StructuredLogger } from './logging/structured-logger';" : '')
    .replaceAll('/*__RATE_LIMIT_IMPORT__*/', config.features.rateLimit ? "import { ApiRateLimitGuard } from './rate-limit/api-rate-limit.guard';" : '')
    .replaceAll('__OPTIONAL_API_DEPENDENCIES__', optionalDependencies.length ? `, ${optionalDependencies.join(', ')}` : '')
    .replaceAll('__OPTIONAL_API_DEV_DEPENDENCIES__', optionalDevDependencies.length ? `, ${optionalDevDependencies.join(', ')}` : '')
    .replaceAll('/*__REDIS_ENV__*/', optionalApiEnv)
    .replaceAll('/*__SMTP_ENV__*/', '')
    .replaceAll('DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public\n', config.stack.database === 'none' ? '' : 'DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public\n')
    .replaceAll('/*__ECOMMERCE_PRISMA_SCHEMA__*/', ecommerce ? `\nmodel Product {\n  id          String   @id @default(cuid())\n  sku         String   @unique\n  name        String\n  description String\n  priceCents  Int\n  currency    String   @default(\"USD\")\n  category    String\n  active      Boolean  @default(true)\n  createdAt   DateTime @default(now())\n}\n` : '')
    .replaceAll('__ECOMMERCE_PERMISSION_CODES__', ecommercePermissionCodes)
    .replaceAll('__ECOMMERCE_MEMBER_GRANTS__', ecommerceMemberGrants)
    .replaceAll('__ECOMMERCE_ADMIN_GRANTS__', ecommerceAdminGrants)
    .replaceAll('__ECOMMERCE_MEMBER_CODES__', ecommerce ? "['products:read']" : '[]')
    .replaceAll('__ECOMMERCE_NAVIGATION_COUNT__', ecommerce && config.features.navigation === 'dynamic' ? '5' : '4')
    .replaceAll('__ECOMMERCE_MEMBER_PRODUCT_ACCESS__', ecommerce ? 'true' : 'false')
    .replaceAll('__ECOMMERCE_ADMIN_PRODUCT_ACCESS__', ecommerce ? 'true' : 'false')
    .replaceAll('__ECOMMERCE_SEED_PERMISSIONS__', ecommerceSeedPermissions)
    .replaceAll('__ECOMMERCE_SEED_NAVIGATION__', ecommerceSeedNavigation)
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
