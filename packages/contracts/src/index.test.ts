import { describe, expect, it } from 'vitest';
import { catalogSchema, projectConfigSchema } from './index';

const validConfig = {
  schemaVersion: 3,
  project: { name: 'commerce-app', blueprint: 'ecommerce', shape: 'fullstack', profile: 'enterprise' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'turborepo' },
  stack: {
    language: 'php',
    backend: 'laravel',
    frontend: 'vue-vite',
    database: 'postgresql',
    orm: 'eloquent',
  },
  company: { mode: 'multi', superAdminScope: 'global' },
  features: {
    auth: true, authStrategy: 'jwt-refresh', rbac: true, navigation: 'dynamic', audit: true,
    redis: true, docker: true, queue: true, realtime: true, apiDocs: true, smtp: true,
    uploads: true, generatedTests: true, logging: true, ciCd: true, rateLimit: true,
  },
  dataMode: 'api-backed',
  deploymentProfile: 'vps',
  output: { destination: 'github' },
  theme: {
    preset: 'pos', palette: 'emerald', mode: 'dark', primary: '#2563EB', accent: '#F59E0B',
    radius: 'large', shadow: 'subtle', density: 'compact',
  },
};

describe('projectConfigSchema', () => {
  it('accepts a supported configuration document', () => {
    expect(projectConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it.each(['../escape', 'A Bad Name', '.hidden', 'foo/bar'])('rejects unsafe project name %s', name => {
    expect(projectConfigSchema.safeParse({ ...validConfig, project: { ...validConfig.project, name } }).success).toBe(false);
  });

  it.each(['con', 'nul', 'prn', 'aux', 'com1', 'lpt9'])('rejects Windows device name %s', name => {
    expect(projectConfigSchema.safeParse({ ...validConfig, project: { ...validConfig.project, name } }).success).toBe(false);
  });

  it('rejects an invalid CSS color', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, theme: { ...validConfig.theme, primary: 'red; color: blue' } }).success).toBe(false);
  });

  it('rejects unknown configuration fields', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, unexpected: true }).success).toBe(false);
  });

  it('requires an explicit foundation profile', () => {
    const { profile: _profile, ...project } = validConfig.project;
    expect(projectConfigSchema.safeParse({ ...validConfig, project }).success).toBe(false);
  });

  it('rejects old and unknown schema versions', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, schemaVersion: 2 }).success).toBe(false);
    expect(projectConfigSchema.safeParse({ ...validConfig, schemaVersion: 99 }).success).toBe(false);
  });

  it('rejects a technology choice outside the registered finite option set', () => {
    expect(projectConfigSchema.safeParse({
      ...validConfig,
      stack: { ...validConfig.stack, language: 'rust' },
    }).success).toBe(false);
  });

  it('rejects an output destination outside the explicit ZIP and GitHub paths', () => {
    expect(projectConfigSchema.safeParse({
      ...validConfig,
      output: { destination: 's3' },
    }).success).toBe(false);
  });
});

export { validConfig };

describe('catalogSchema', () => {
  it('requires every wizard selection category and a reason for unavailable choices', () => {
    const categories = [
      'profiles', 'blueprints', 'shapes', 'layouts', 'languages', 'backends', 'frontends',
      'databases', 'orms', 'packageManagers', 'taskRunners', 'companyModes',
      'superAdminScopes', 'auth', 'authStrategies', 'rbac', 'navigation', 'audit', 'redis', 'docker',
      'queue', 'realtime', 'apiDocs', 'smtp', 'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit',
      'dataModes', 'deploymentProfiles', 'outputDestinations', 'themes', 'palettes', 'themeModes',
      'themeRadii', 'themeShadows', 'themeDensities',
    ];
    const complete = Object.fromEntries(categories.map(key => [key, [{ value: 'sample', label: 'Sample', available: true }]]));
    expect(catalogSchema.safeParse(complete).success).toBe(true);
    expect(catalogSchema.safeParse({ ...complete, backends: undefined }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...complete, auth: [{ value: 'true', label: 'Enabled', available: false }] }).success).toBe(false);
  });
});
