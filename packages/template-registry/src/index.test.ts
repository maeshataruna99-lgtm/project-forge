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

  it('explains why an unimplemented blueprint is disabled', () => {
    const issues = validateCompatibility({ ...base, project: { ...base.project, blueprint: 'ecommerce' } });
    expect(issues).toContainEqual(expect.objectContaining({ path: 'project.blueprint', code: 'TEMPLATE_UNAVAILABLE' }));
    expect(issues[0]?.message.length).toBeGreaterThan(10);
  });

  it('rejects an unsupported output shape', () => {
    expect(validateCompatibility({ ...base, project: { ...base.project, shape: 'api-only' } })).toContainEqual(
      expect.objectContaining({ path: 'project.shape', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it('rejects an unsupported repository layout', () => {
    expect(validateCompatibility({ ...base, repository: { ...base.repository, layout: 'single-app' } })).toContainEqual(
      expect.objectContaining({ path: 'repository.layout', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it('rejects a stack that cannot be rendered by the first template', () => {
    expect(validateCompatibility({ ...base, stack: { ...base.stack, backend: 'none' } })).toContainEqual(
      expect.objectContaining({ path: 'stack.backend', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it('rejects enterprise profile until its template exists', () => {
    expect(validateCompatibility({ ...base, project: { ...base.project, profile: 'enterprise' } })).toContainEqual(
      expect.objectContaining({ path: 'project.profile', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it.each(['auth', 'rbac', 'audit'] as const)('rejects %s until it is generated', feature => {
    expect(validateCompatibility({ ...base, features: { ...base.features, [feature]: true } })).toContainEqual(
      expect.objectContaining({ path: `features.${feature}`, code: 'FEATURE_UNAVAILABLE' }),
    );
  });

  it('rejects multi-company until company isolation is generated', () => {
    expect(validateCompatibility({ ...base, company: { ...base.company, mode: 'multi' } })).toContainEqual(
      expect.objectContaining({ path: 'company.mode', code: 'TEMPLATE_UNAVAILABLE' }),
    );
  });

  it('rejects optional infrastructure with no template fragment yet', () => {
    expect(validateCompatibility({ ...base, features: { ...base.features, redis: true } })).toContainEqual(
      expect.objectContaining({ path: 'features.redis', code: 'FEATURE_UNAVAILABLE' }),
    );
  });

  it('publishes machine readable availability', () => {
    expect(catalog.blueprints.find(choice => choice.value === 'ecommerce')?.available).toBe(false);
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
        const candidate = section === 'root'
          ? { ...base, [field]: value }
          : { ...base, [section]: { ...base[section], [field]: value } };
        expect(validateCompatibility(candidate).length === 0, `${category}.${choice.value}`).toBe(choice.available);
      }
    }
  });
});
