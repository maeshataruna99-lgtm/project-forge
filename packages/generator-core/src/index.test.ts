import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { assertSafeArchivePath, ConfigurationError, createArchive, createArchiveAsync, createPlan } from './index';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../../templates/typescript-nest-vue/fragments/auth/auth.service';
import { resolveCompanyWhere, scopeQuery } from '../../../templates/typescript-nest-vue/fragments/company/scope';

const config = {
  schemaVersion: 4,
  project: { name: 'sample-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false, redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false, uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false },
  dataMode: 'api-backed', deploymentProfile: 'local', output: { destination: 'zip' },
  ui: { layout: 'single-column' },
  theme: { preset: 'modern-saas', palette: 'blue', mode: 'light', primary: '#2563EB', accent: '#F59E0B', radius: 'medium', shadow: 'subtle', density: 'comfortable' },
};

describe('generator core', () => {
  it('plans a blank fullstack project from a validated configuration', () => {
    const plan = createPlan(config);
    expect(plan.projectName).toBe('sample-app');
    expect(plan.files).toContain('apps/api/src/main.ts');
    expect(plan.files).toContain('apps/web/src/App.vue');
    expect(plan.files).toContain('packages/contracts/src/index.ts');
    expect(plan.files).toContain('packages/config/tsconfig.base.json');
    expect(plan.files).toContain('prisma/schema.prisma');
  });

  it('generates an isolated Laravel API pack with Composer and no TypeScript workspace files', () => {
    const laravel = {
      ...config,
      project: { ...config.project, blueprint: 'laravel-api', shape: 'api-only' },
      repository: { ...config.repository, layout: 'single-app', packageManager: 'composer' },
      stack: { language: 'php', backend: 'laravel', frontend: 'none', database: 'postgresql', orm: 'eloquent' },
    };
    const plan = createPlan(laravel);
    expect(plan.templatePack).toBe('php-laravel');
    expect(plan.files).toContain('composer.json');
    expect(plan.files).toContain('artisan');
    expect(plan.files).toContain('routes/api.php');
    expect(plan.files).not.toContain('package.json');
    const files = unzipSync(createArchive(laravel));
    expect(strFromU8(files['sample-app/composer.json']!)).toContain('laravel/framework');
    expect(Object.keys(files).some(path => path.endsWith('.ts') || path.endsWith('.vue'))).toBe(false);
  });

  it('uses a valid vendor-qualified Composer package name in Laravel output', () => {
    const laravel = {
      ...config,
      project: { ...config.project, blueprint: 'laravel-api', shape: 'api-only' },
      repository: { ...config.repository, layout: 'single-app', packageManager: 'composer' },
      stack: { language: 'php', backend: 'laravel', frontend: 'none', database: 'postgresql', orm: 'eloquent' },
    };
    const files = unzipSync(createArchive(laravel));
    expect(JSON.parse(strFromU8(files['sample-app/composer.json']!)).name).toBe('project-forge/sample-app');
  });

  it('adds Turborepo scripts, dependency graph, and root task configuration only when selected', () => {
    const turbo = { ...config, repository: { ...config.repository, taskRunner: 'turborepo' } };
    const plan = createPlan(turbo);
    expect(plan.files).toContain('turbo.json');
    const files = unzipSync(createArchive(turbo));
    const manifest = JSON.parse(strFromU8(files['sample-app/package.json']!));
    const turboJson = JSON.parse(strFromU8(files['sample-app/turbo.json']!));
    expect(manifest.devDependencies.turbo).toBeTruthy();
    expect(manifest.scripts.dev).toBe('turbo run dev');
    expect(turboJson.tasks.build.dependsOn).toContain('^build');
    expect(unzipSync(createArchive(config))).not.toHaveProperty('sample-app/turbo.json');
  });

  it('omits disabled optional integrations and their generated dependencies', () => {
    const files = unzipSync(createArchive(config));
    const destinations = Object.keys(files);
    const apiManifest = JSON.parse(strFromU8(files['sample-app/apps/api/package.json']!));
    expect(destinations.some(path => path.includes('/apps/api/src/redis/'))).toBe(false);
    expect(destinations.some(path => path.includes('/apps/api/src/queue/'))).toBe(false);
    expect(destinations.some(path => path.includes('/apps/api/src/realtime/'))).toBe(false);
    expect(destinations).not.toContain('sample-app/.github/workflows/verify-generated.yml');
    expect(apiManifest.dependencies).not.toHaveProperty('ioredis');
    expect(apiManifest.dependencies).not.toHaveProperty('nodemailer');
    expect(strFromU8(files['sample-app/README.md']!)).not.toContain('__OPTIONAL_README__');
  });

  it('rejects an unsupported configuration before rendering', () => {
    expect(() => createPlan({ ...config, features: { ...config.features, audit: true } })).toThrow(ConfigurationError);
  });

  it('composes auth files only when the supported enterprise profile requests authentication', () => {
    const enterprise = {
      ...config,
      project: { ...config.project, profile: 'enterprise' },
      features: { ...config.features, auth: true },
    };
    const plan = createPlan(enterprise);
    expect(plan.profile).toBe('enterprise');
    expect(plan.files).toContain('apps/api/src/auth/auth.service.ts');
    expect(plan.files).toContain('apps/api/src/auth/auth.controller.ts');
    expect(plan.files).toContain('apps/api/src/company/company.service.ts');
  });

  it('includes the authentication foundation in Enterprise even when the optional Minimal switch is off', () => {
    const plan = createPlan({ ...config, project: { ...config.project, profile: 'enterprise' } });
    expect(plan.capabilities).toContain('auth');
    expect(plan.features.auth).toBe(true);
    expect(plan.files).toContain('apps/api/src/auth/auth.module.ts');
  });

  it('omits auth-only Prisma relations from minimal output when authentication is disabled', () => {
    const files = unzipSync(createArchive(config));
    const schema = strFromU8(files['sample-app/prisma/schema.prisma']!);
    expect(schema).not.toContain('CompanyMembership');
    expect(schema).not.toContain('memberships');
  });

  it('generates independently verifiable access and refresh tokens and salted password hashes', async () => {
    const files = unzipSync(createArchive({ ...config, features: { ...config.features, auth: true } }));
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth.service.ts');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth.guard.ts');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth.module.ts');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth.controller.test.ts');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth.guard.test.ts');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/auth/auth-rate-limit.guard.test.ts');
    const authSource = strFromU8(files['sample-app/apps/api/src/auth/auth.service.ts']!);
    expect(authSource).toContain('scryptSync');
    expect(authSource).toContain('timingSafeEqual');
    expect(authSource).toContain('createHmac');
    expect(authSource).not.toContain('development-secret');
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/company/company.service.ts');
    expect(strFromU8(files['sample-app/apps/api/src/main.ts']!)).toContain("import { AuthModule } from './auth/auth.module';");
    expect(strFromU8(files['sample-app/apps/api/src/main.ts']!)).toContain("import 'dotenv/config';");
    expect(JSON.parse(strFromU8(files['sample-app/apps/api/package.json']!))).toMatchObject({ dependencies: { dotenv: '^16.4.7' } });
    const schema = strFromU8(files['sample-app/prisma/schema.prisma']!);
    expect(schema).toContain('model User');
    expect(schema).toContain('model CompanyMembership');
    expect(strFromU8(files['sample-app/.env.example']!)).toContain('AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters');
    expect(strFromU8(files['sample-app/README.md']!)).toContain('POST /auth/register');
    expect(Object.values(files).some(file => strFromU8(file).includes('__AUTH_'))).toBe(false);
  });

  it('hashes passwords with salts and verifies signed tokens only for their type, secret, and lifetime', () => {
    const secret = 'test-secret-with-at-least-32-characters';
    const identity = { userId: 'user-1', companyId: 'company-1', systemRole: 'company-admin' as const };
    const firstHash = hashPassword('correct horse battery staple');
    const secondHash = hashPassword('correct horse battery staple');
    expect(firstHash).not.toBe(secondHash);
    expect(verifyPassword('correct horse battery staple', firstHash)).toBe(true);
    expect(verifyPassword('wrong password', firstHash)).toBe(false);

    const now = 1_800_000_000_000;
    const accessToken = signToken(identity, secret, 'access', now);
    const refreshToken = signToken(identity, secret, 'refresh', now);
    expect(verifyToken(accessToken, secret, 'access', now + 1_000)).toEqual(identity);
    expect(verifyToken(refreshToken, secret, 'refresh', now + 1_000)).toEqual(identity);
    expect(verifyToken(accessToken, 'another-secret-with-at-least-32-characters', 'access', now)).toBeNull();
    expect(verifyToken(accessToken, secret, 'refresh', now)).toBeNull();
    expect(verifyToken(accessToken, secret, 'access', now + 16 * 60_000)).toBeNull();
  });

  it('derives every company query from verified identity and rejects another tenant', () => {
    const identity = { userId: 'user-1', companyId: 'company-a', systemRole: 'member' as const };
    expect(resolveCompanyWhere(identity)).toEqual({ companyId: 'company-a' });
    expect(resolveCompanyWhere(identity, 'company-b')).toBeNull();
    expect(scopeQuery(identity, { companyId: 'company-b', status: 'active' })).toEqual({ companyId: 'company-a', status: 'active' });
  });

  it('composes RBAC, dynamic navigation, and audit fragments only when selected', () => {
    const secured = {
      ...config,
      features: { ...config.features, auth: true, rbac: true, navigation: 'dynamic', audit: true },
    };
    const plan = createPlan(secured);
    expect(plan.files).toContain('apps/api/src/rbac/permission.guard.ts');
    expect(plan.files).toContain('apps/api/src/navigation/navigation.service.ts');
    expect(plan.files).toContain('apps/api/src/navigation/navigation.controller.ts');
    expect(plan.files).toContain('apps/api/src/audit/audit.service.ts');
    expect(plan.files).toContain('apps/api/src/audit/audit.controller.ts');
    expect(plan.files).toContain('apps/api/src/rbac/seed-access-control.test.ts');
    expect(plan.files).toContain('apps/web/src/components/StarterAuth.vue');
    const files = unzipSync(createArchive(secured));
    const main = strFromU8(files['sample-app/apps/api/src/main.ts']!);
    expect(main).toContain("import { RbacModule } from './rbac/rbac.module';");
    expect(main).toContain("import { NavigationModule } from './navigation/navigation.module';");
    expect(main).toContain("import { AuditModule } from './audit/audit.module';");
    const schema = strFromU8(files['sample-app/prisma/schema.prisma']!);
    expect(schema).toContain('model Permission');
    expect(schema).toContain('model NavigationItem');
    expect(schema).toContain('model AuditEvent');
    expect(JSON.parse(strFromU8(files['sample-app/package.json']!)).scripts['db:seed']).toBe('node prisma/seed.mjs');
    const authUi = strFromU8(files['sample-app/apps/web/src/components/StarterAuth.vue']!);
    expect(authUi).toContain("fetch('/api/navigation'");
    expect(authUi).toContain('accessToken.value = result.accessToken');
    expect(authUi).not.toContain('localStorage');
    expect(strFromU8(files['sample-app/apps/web/src/App.vue']!)).toContain('<StarterAuth />');
    expect(Object.values(files).some(file => strFromU8(file).includes('__'))).toBe(false);
    expect(createPlan(config).files).not.toContain('apps/api/src/rbac/permission.guard.ts');
  });

  it('distinguishes malformed input from an unavailable template', () => {
    try {
      createPlan({ ...config, project: { ...config.project, name: '../bad' } });
      throw new Error('Expected validation failure');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as ConfigurationError).issues).toContainEqual(expect.objectContaining({ path: 'project.name', code: 'INVALID_INPUT' }));
    }
  });

  it.each(['../secret', '/absolute', 'C:/drive', 'folder\\evil', 'a/../b', '.env', 'a//b'])('rejects unsafe archive path %s', path => {
    expect(() => assertSafeArchivePath(path)).toThrow();
  });

  it('packages real template assets with validated theme tokens', () => {
    const files = unzipSync(createArchive(config));
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/main.ts');
    expect(strFromU8(files['sample-app/apps/web/src/style.css']!)).toContain('#2563EB');
    expect(strFromU8(files['sample-app/package.json']!)).toContain('sample-app');
    expect(strFromU8(files['sample-app/apps/web/src/App.vue']!)).toContain('/api/health');
    expect(Object.keys(files).some(path => path.endsWith('/.env'))).toBe(false);
    expect(Object.keys(files).some(path => path.includes('/auth/'))).toBe(false);
    expect(strFromU8(files['sample-app/prisma/schema.prisma']!)).not.toContain('model User');
    expect(strFromU8(files['sample-app/.env.example']!)).not.toContain('AUTH_SECRET=');
  });

  it('produces the same file names and contents for repeated configurations', () => {
    const first = unzipSync(createArchive(config));
    const second = unzipSync(createArchive(config));
    expect(Object.keys(first)).toEqual(Object.keys(second));
    for (const path of Object.keys(first)) expect(first[path]).toEqual(second[path]);
  });

  it('returns a sorted plan and byte-identical archives for sync and worker-backed generation', async () => {
    const plan = createPlan(config);
    expect(plan.files).toEqual([...plan.files].sort());
    expect(plan).toMatchObject({ templatePack: 'typescript-nest-vue', shape: 'fullstack', layout: 'monorepo', dataMode: 'api-backed', deploymentProfile: 'local', outputDestination: 'zip' });
    const sync = createArchive(config);
    expect(createArchive(config)).toEqual(sync);
    expect(await createArchiveAsync(config)).toEqual(sync);
  });

  it('emits isolated API-only and frontend-only single-app manifests', () => {
    const apiOnly = {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      repository: { ...config.repository, layout: 'single-app' },
      stack: { ...config.stack, frontend: 'none' },
    };
    const frontendOnly = {
      ...config,
      project: { ...config.project, shape: 'frontend-only' },
      repository: { ...config.repository, layout: 'single-app' },
      stack: { ...config.stack, backend: 'none', database: 'none', orm: 'none' },
      dataMode: 'demo',
    };
    const apiFiles = unzipSync(createArchive(apiOnly));
    const frontendFiles = unzipSync(createArchive(frontendOnly));
    expect(Object.keys(apiFiles)).toContain('sample-app/apps/api/src/main.ts');
    expect(Object.keys(apiFiles).some(path => path.includes('/apps/web/'))).toBe(false);
    expect(Object.keys(apiFiles)).not.toContain('sample-app/pnpm-workspace.yaml');
    expect(JSON.parse(strFromU8(apiFiles['sample-app/package.json']!)).scripts.dev).toContain('apps/api/src/main.ts');
    expect(Object.keys(frontendFiles)).toContain('sample-app/apps/web/src/App.vue');
    expect(Object.keys(frontendFiles).some(path => path.includes('/apps/api/') || path.includes('/prisma/'))).toBe(false);
    expect(JSON.parse(strFromU8(frontendFiles['sample-app/package.json']!)).dependencies).not.toHaveProperty('@nestjs/common');
  });

  it('omits database files and dependencies from API-only output when no database is selected', () => {
    const apiWithoutDatabase = {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      stack: { ...config.stack, frontend: 'none', database: 'none', orm: 'none' },
    };
    const files = unzipSync(createArchive(apiWithoutDatabase));
    const names = Object.keys(files);
    expect(names).not.toContain('sample-app/prisma/schema.prisma');
    expect(names).not.toContain('sample-app/packages/contracts/src/index.ts');
    expect(JSON.parse(strFromU8(files['sample-app/package.json']!)).scripts).not.toHaveProperty('db:generate');
    expect(JSON.parse(strFromU8(files['sample-app/apps/api/package.json']!)).dependencies).not.toHaveProperty('@sample-app/contracts');
    expect(strFromU8(files['sample-app/README.md']!)).toContain('no database or persistent storage');
  });

  it('composes the registered E-commerce catalog API, permission codes, navigation, and UI', () => {
    const ecommerce = {
      ...config,
      project: { ...config.project, blueprint: 'ecommerce' },
      features: { ...config.features, auth: true, rbac: true, navigation: 'dynamic' },
    };
    const plan = createPlan(ecommerce);
    expect(plan.files).toContain('apps/api/src/products/products.controller.ts');
    expect(plan.files).toContain('apps/web/src/App.vue');
    const files = unzipSync(createArchive(ecommerce));
    expect(Object.keys(files)).toContain('sample-app/apps/api/src/products/products.controller.test.ts');
    expect(strFromU8(files['sample-app/apps/api/src/main.ts']!)).toContain("import { ProductsModule } from './products/products.module';");
    expect(strFromU8(files['sample-app/apps/api/src/products/products.controller.ts']!)).toContain("@RequirePermission('products:read')");
    expect(strFromU8(files['sample-app/apps/api/src/rbac/permissions.ts']!)).toContain("'products:read'");
    expect(strFromU8(files['sample-app/apps/api/src/rbac/seed-access-control.mjs']!)).toContain("'/products'");
    expect(strFromU8(files['sample-app/apps/web/src/App.vue']!)).toContain('fetch("/api/products")');
    expect(strFromU8(files['sample-app/README.md']!)).toContain('not a checkout, payment, inventory, or order system');
  });

  it('generates the same resolved theme tokens used by the wizard preview', () => {
    const themed = {
      ...config,
      theme: { ...config.theme, preset: 'dark-developer', palette: 'purple', mode: 'dark', primary: '#A78BFA', accent: '#F0ABFC', radius: 'large', shadow: 'strong', density: 'compact' },
    };
    const files = unzipSync(createArchive(themed));
    const css = strFromU8(files['sample-app/apps/web/src/style.css']!);
    expect(css).toContain('--background: #09090B');
    expect(css).toContain('--surface: #18181B');
    expect(css).toContain('--text: #FAFAFA');
    expect(css).toContain('--radius: 1rem');
    expect(css).toContain('--shadow: 0 12px 28px rgb(0 0 0 / 0.28)');
    expect(css).toContain('--density-gap: 0.75rem');
    expect(css).not.toMatch(/__[A-Z_]+__/);
  });

  it.each([
    ['modern-saas', '#F8FAFC'], ['ecommerce-store', '#FFF9F5'], ['admin-dashboard', '#F1F5F9'],
    ['pos', '#F8FAF5'], ['warehouse-industrial', '#F4F5F7'], ['soft-pastel', '#FFF7FB'],
    ['dark-developer', '#F4F4F5'], ['corporate', '#F3F6FA'],
  ] as const)('renders the registered %s preset background into preview/runtime tokens', (preset, background) => {
    const themed = { ...config, theme: { ...config.theme, preset } };
    const files = unzipSync(createArchive(themed));
    expect(strFromU8(files['sample-app/apps/web/src/style.css']!)).toContain(`--background: ${background}`);
  });

  it('composes selected integrations and Docker deployment without orphan files', () => {
    const integrated = {
      ...config,
      features: {
        ...config.features, redis: true, docker: true, queue: true, realtime: true, apiDocs: true,
        smtp: true, uploads: true, generatedTests: true, logging: true, ciCd: true, rateLimit: true,
      },
      deploymentProfile: 'docker',
    };
    const plan = createPlan(integrated);
    for (const path of [
      'apps/api/src/redis/redis.module.ts', 'apps/api/src/queue/queue.module.ts',
      'apps/api/src/realtime/realtime.gateway.ts', 'apps/api/src/api-docs/setup.ts',
      'apps/api/src/email/email.service.ts', 'apps/api/src/uploads/uploads.controller.ts',
      'apps/api/src/rate-limit/api-rate-limit.guard.ts', 'apps/api/src/logging/structured-logger.ts',
      'apps/api/src/generated-feature.test.ts', '.github/workflows/verify-generated.yml',
      'docker-compose.yml', 'deploy/docker/Dockerfile.api', 'deploy/docker/Dockerfile.web',
    ]) expect(plan.files, path).toContain(path);
    const files = unzipSync(createArchive(integrated));
    const apiManifest = JSON.parse(strFromU8(files['sample-app/apps/api/package.json']!));
    expect(apiManifest.dependencies).toMatchObject({ ioredis: expect.any(String), '@nestjs/swagger': expect.any(String), nodemailer: expect.any(String) });
    expect(strFromU8(files['sample-app/.env.example']!)).toContain('REDIS_URL=');
    expect(strFromU8(files['sample-app/docker-compose.yml']!)).toContain('postgres:');
    expect(strFromU8(files['sample-app/deploy/docker/Dockerfile.api']!)).toContain('pnpm db:generate');
    expect(Object.values(files).some(file => strFromU8(file).includes('__'))).toBe(false);
  });

  it('emits only the selected Vercel and VPS deployment recipes', () => {
    const vercel = {
      ...config,
      project: { ...config.project, shape: 'frontend-only' },
      stack: { ...config.stack, backend: 'none', database: 'none', orm: 'none' },
      dataMode: 'demo', deploymentProfile: 'vercel',
    };
    expect(createPlan(vercel).files).toContain('vercel.json');
    expect(createPlan({ ...config, deploymentProfile: 'vps' }).files).toContain('deploy/vps/README.md');
  });

  it('emits Docker compose manifests without a phantom database for database-free API projects', () => {
    const noDatabaseApi = {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      stack: { ...config.stack, frontend: 'none', database: 'none', orm: 'none' },
      deploymentProfile: 'docker',
    };
    const apiFiles = unzipSync(createArchive(noDatabaseApi));
    const apiCompose = strFromU8(apiFiles['sample-app/docker-compose.yml']!);
    expect(apiCompose).toContain('PORT: 3000');
    expect(apiCompose).not.toContain('postgres:');
    expect(apiCompose).not.toContain('DATABASE_URL');
    expect(apiFiles).toHaveProperty('sample-app/.env.example');

  });
});
