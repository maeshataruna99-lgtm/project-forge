import { describe, expect, it } from 'vitest';
import { catalogSchema, projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';
import { catalog, validateCompatibility } from './index';

const base: ProjectConfig = {
  schemaVersion: 3,
  project: { name: 'my-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: {
    auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false,
    redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false,
    uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false,
  },
  dataMode: 'api-backed',
  deploymentProfile: 'local',
  output: { destination: 'zip' },
  theme: {
    preset: 'modern-saas', palette: 'blue', mode: 'light', primary: '#2563EB', accent: '#F59E0B',
    radius: 'medium', shadow: 'subtle', density: 'comfortable',
  },
};

describe('first template registry', () => {
  it('accepts the first supported configuration', () => {
    expect(validateCompatibility(base)).toEqual([]);
  });

  it('accepts E-commerce for fullstack monorepos and rejects incompatible shapes', () => {
    expect(validateCompatibility({ ...base, project: { ...base.project, blueprint: 'ecommerce' } })).toEqual([]);
    expect(validateCompatibility({
      ...base,
      project: { ...base.project, blueprint: 'ecommerce', shape: 'frontend-only' },
      stack: { ...base.stack, backend: 'none', database: 'none', orm: 'none' },
      dataMode: 'demo',
    })).toContainEqual(expect.objectContaining({ path: 'project.blueprint', code: 'FEATURE_DEPENDENCY' }));
  });

  it('rejects server-only authorization on the frontend-only shape', () => {
    expect(validateCompatibility({
      ...base,
      project: { ...base.project, shape: 'frontend-only' },
      features: { ...base.features, auth: true },
    })).toContainEqual(
      expect.objectContaining({ path: 'project.shape', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('rejects single-app fullstack because it requires a monorepo output', () => {
    expect(validateCompatibility({ ...base, repository: { ...base.repository, layout: 'single-app' } })).toContainEqual(
      expect.objectContaining({ path: 'repository.layout', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('rejects a stack that cannot be rendered by the first template', () => {
    expect(validateCompatibility({ ...base, stack: { ...base.stack, backend: 'none' } })).toContainEqual(
      expect.objectContaining({ path: 'stack.backend', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it('accepts enterprise profile with its included authentication foundation', () => {
    expect(validateCompatibility({
      ...base,
      project: { ...base.project, profile: 'enterprise' },
    })).toEqual([]);
  });

  it('accepts authentication when selected', () => {
    expect(validateCompatibility({ ...base, features: { ...base.features, auth: true } })).toEqual([]);
  });

  it.each(['rbac', 'audit'] as const)('rejects %s until authentication exists', feature => {
    expect(validateCompatibility({ ...base, features: { ...base.features, [feature]: true } })).toContainEqual(
      expect.objectContaining({ path: 'features.auth', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('reports stable dependency paths for RBAC, dynamic navigation, and audit', () => {
    expect(validateCompatibility({ ...base, features: { ...base.features, rbac: true } })).toContainEqual(
      expect.objectContaining({ path: 'features.auth', code: 'FEATURE_DEPENDENCY' }),
    );
    expect(validateCompatibility({ ...base, features: { ...base.features, navigation: 'dynamic' } })).toContainEqual(
      expect.objectContaining({ path: 'features.rbac', code: 'FEATURE_DEPENDENCY' }),
    );
    expect(validateCompatibility({ ...base, features: { ...base.features, audit: true } })).toContainEqual(
      expect.objectContaining({ path: 'features.auth', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('supports RBAC, permission-filtered navigation, and audit only when their identity dependencies exist', () => {
    const features = { ...base.features, auth: true, rbac: true, navigation: 'dynamic' as const, audit: true };
    expect(validateCompatibility({ ...base, features })).toEqual([]);
  });

  it('reports server-only authorization controls on a frontend-only project shape', () => {
    const candidate = {
      ...base,
      project: { ...base.project, shape: 'frontend-only' as const },
      features: { ...base.features, auth: true, rbac: true, navigation: 'dynamic' as const, audit: true },
    };
    expect(validateCompatibility(candidate)).toContainEqual(
      expect.objectContaining({ path: 'project.shape', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('supports explicit API-only and frontend-only demo stacks with single-app outputs', () => {
    const apiOnly = {
      ...base,
      project: { ...base.project, shape: 'api-only' as const },
      repository: { ...base.repository, layout: 'single-app' as const },
      stack: { ...base.stack, frontend: 'none' as const },
    };
    const frontendOnly = {
      ...base,
      project: { ...base.project, shape: 'frontend-only' as const },
      repository: { ...base.repository, layout: 'single-app' as const },
      stack: { ...base.stack, backend: 'none' as const, database: 'none' as const, orm: 'none' as const },
      dataMode: 'demo' as const,
    };
    expect(validateCompatibility(apiOnly)).toEqual([]);
    expect(validateCompatibility(frontendOnly)).toEqual([]);
  });

  it('requires a persistent database when API authentication is enabled', () => {
    const apiWithoutDatabase = {
      ...base,
      project: { ...base.project, shape: 'api-only' as const },
      stack: { ...base.stack, frontend: 'none' as const, database: 'none' as const, orm: 'none' as const },
      features: { ...base.features, auth: true },
    };
    expect(validateCompatibility(apiWithoutDatabase)).toContainEqual(
      expect.objectContaining({ path: 'stack.database', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('enables server integrations only for compatible server shapes and requires Redis for queueing', () => {
    const queueWithoutRedis = { ...base, features: { ...base.features, queue: true } };
    expect(validateCompatibility(queueWithoutRedis)).toContainEqual(
      expect.objectContaining({ path: 'features.redis', code: 'FEATURE_DEPENDENCY' }),
    );
    expect(validateCompatibility({ ...base, features: { ...base.features, redis: true, queue: true } })).toEqual([]);
    const frontendOnly = {
      ...base,
      project: { ...base.project, shape: 'frontend-only' as const },
      stack: { ...base.stack, backend: 'none' as const, database: 'none' as const, orm: 'none' as const },
      dataMode: 'demo' as const,
      features: { ...base.features, apiDocs: true },
    };
    expect(validateCompatibility(frontendOnly)).toContainEqual(
      expect.objectContaining({ path: 'features.apiDocs', code: 'FEATURE_DEPENDENCY' }),
    );
  });

  it('allows supported deployment profiles and scopes Vercel to frontend-only output', () => {
    expect(validateCompatibility({ ...base, deploymentProfile: 'docker' })).toEqual([]);
    expect(validateCompatibility({ ...base, deploymentProfile: 'vps' })).toEqual([]);
    expect(validateCompatibility({ ...base, deploymentProfile: 'vercel' })).toContainEqual(
      expect.objectContaining({ path: 'deploymentProfile', code: 'FEATURE_DEPENDENCY' }),
    );
    expect(validateCompatibility({
      ...base,
      project: { ...base.project, shape: 'frontend-only' as const },
      stack: { ...base.stack, backend: 'none' as const, database: 'none' as const, orm: 'none' as const },
      dataMode: 'demo' as const,
      deploymentProfile: 'vercel',
    })).toEqual([]);
  });

  it('supports multiple companies with authentication enabled', () => {
    expect(validateCompatibility({
      ...base,
      project: { ...base.project, profile: 'enterprise' },
      company: { ...base.company, mode: 'multi' },
      features: { ...base.features, auth: true },
    })).toEqual([]);
  });

  it('exposes implemented optional infrastructure as available', () => {
    expect(validateCompatibility({ ...base, features: { ...base.features, redis: true } })).toEqual([]);
  });

  it('publishes machine readable availability', () => {
    expect(catalog.blueprints.find(choice => choice.value === 'ecommerce')?.available).toBe(true);
  });

  it('covers every enum choice and boolean state in the configuration schema', () => {
    const fields = [
      ['profiles', projectConfigSchema.shape.project.shape.profile.options],
      ['blueprints', projectConfigSchema.shape.project.shape.blueprint.options],
      ['shapes', projectConfigSchema.shape.project.shape.shape.options],
      ['layouts', projectConfigSchema.shape.repository.shape.layout.options],
      ['packageManagers', projectConfigSchema.shape.repository.shape.packageManager.options],
      ['taskRunners', projectConfigSchema.shape.repository.shape.taskRunner.options],
      ['languages', projectConfigSchema.shape.stack.shape.language.options],
      ['backends', projectConfigSchema.shape.stack.shape.backend.options],
      ['frontends', projectConfigSchema.shape.stack.shape.frontend.options],
      ['databases', projectConfigSchema.shape.stack.shape.database.options],
      ['orms', projectConfigSchema.shape.stack.shape.orm.options],
      ['companyModes', projectConfigSchema.shape.company.shape.mode.options],
      ['superAdminScopes', projectConfigSchema.shape.company.shape.superAdminScope.options],
      ['navigation', projectConfigSchema.shape.features.shape.navigation.options],
      ['authStrategies', projectConfigSchema.shape.features.shape.authStrategy.options],
      ['themes', projectConfigSchema.shape.theme.shape.preset.options],
      ['palettes', projectConfigSchema.shape.theme.shape.palette.options],
      ['themeModes', projectConfigSchema.shape.theme.shape.mode.options],
      ['themeRadii', projectConfigSchema.shape.theme.shape.radius.options],
      ['themeShadows', projectConfigSchema.shape.theme.shape.shadow.options],
      ['themeDensities', projectConfigSchema.shape.theme.shape.density.options],
      ['dataModes', projectConfigSchema.shape.dataMode.options],
      ['deploymentProfiles', projectConfigSchema.shape.deploymentProfile.options],
      ['outputDestinations', projectConfigSchema.shape.output.shape.destination.options],
    ] as const;
    for (const [category, options] of fields) {
      expect(catalog[category].map(choice => choice.value).sort(), category).toEqual([...options].sort());
    }
    for (const category of [
      'auth', 'rbac', 'audit', 'redis', 'docker', 'queue', 'realtime', 'apiDocs', 'smtp',
      'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit',
    ] as const) {
      expect(catalog[category].map(choice => choice.value).sort(), category).toEqual(['false', 'true']);
    }
    expect(catalogSchema.safeParse(catalog).success).toBe(true);
  });

  it('marks a choice available exactly when compatibility accepts it', () => {
    const fields = [
      ['profiles', 'project', 'profile'], ['blueprints', 'project', 'blueprint'], ['shapes', 'project', 'shape'],
      ['layouts', 'repository', 'layout'], ['packageManagers', 'repository', 'packageManager'],
      ['taskRunners', 'repository', 'taskRunner'], ['languages', 'stack', 'language'],
      ['backends', 'stack', 'backend'], ['frontends', 'stack', 'frontend'],
      ['databases', 'stack', 'database'], ['orms', 'stack', 'orm'],
      ['companyModes', 'company', 'mode'], ['superAdminScopes', 'company', 'superAdminScope'],
      ['auth', 'features', 'auth'], ['rbac', 'features', 'rbac'], ['navigation', 'features', 'navigation'],
      ['authStrategies', 'features', 'authStrategy'], ['audit', 'features', 'audit'], ['redis', 'features', 'redis'],
      ['docker', 'features', 'docker'], ['queue', 'features', 'queue'], ['realtime', 'features', 'realtime'],
      ['apiDocs', 'features', 'apiDocs'], ['smtp', 'features', 'smtp'], ['uploads', 'features', 'uploads'],
      ['generatedTests', 'features', 'generatedTests'], ['logging', 'features', 'logging'],
      ['ciCd', 'features', 'ciCd'], ['rateLimit', 'features', 'rateLimit'],
      ['themes', 'theme', 'preset'], ['palettes', 'theme', 'palette'], ['themeModes', 'theme', 'mode'],
      ['themeRadii', 'theme', 'radius'], ['themeShadows', 'theme', 'shadow'], ['themeDensities', 'theme', 'density'],
      ['dataModes', 'root', 'dataMode'], ['deploymentProfiles', 'root', 'deploymentProfile'],
      ['outputDestinations', 'output', 'destination'],
    ] as const;
    for (const [category, section, field] of fields) {
      for (const choice of catalog[category]) {
        const value = [
          'auth', 'rbac', 'audit', 'redis', 'docker', 'queue', 'realtime', 'apiDocs', 'smtp',
          'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit',
        ].includes(category) ? choice.value === 'true' : choice.value;
        const candidate = structuredClone(base) as ProjectConfig;
        if (section === 'root') (candidate as unknown as Record<string, unknown>)[field] = value;
        else (candidate[section] as unknown as Record<string, unknown>)[field] = value;
        for (const requirement of choice.requires ?? []) {
          const parts = requirement.path.split('.');
          let target: Record<string, unknown> = candidate;
          for (const part of parts.slice(0, -1)) {
            if (!target[part] || typeof target[part] !== 'object') target[part] = {};
            target = target[part] as Record<string, unknown>;
          }
          target[parts.at(-1)!] = requirement.equals;
        }
        for (const conflict of choice.conflicts ?? []) {
          const parts = conflict.path.split('.');
          let target: Record<string, unknown> = candidate;
          for (const part of parts.slice(0, -1)) {
            if (!target[part] || typeof target[part] !== 'object') target[part] = {};
            target = target[part] as Record<string, unknown>;
          }
          target[parts.at(-1)!] = conflict.equals === 'fullstack' ? 'api-only' : 'fullstack';
        }
        if (category === 'layouts' && choice.value === 'single-app') {
          candidate.stack.frontend = 'none';
        }
        if (category === 'deploymentProfiles' && choice.value === 'vercel') {
          candidate.stack.backend = 'none';
          candidate.stack.database = 'none';
          candidate.stack.orm = 'none';
          candidate.dataMode = 'demo';
        }
        expect(validateCompatibility(candidate).length === 0, `${category}.${choice.value}`).toBe(choice.available);
      }
    }
  });
});
