import { describe, expect, it } from 'vitest';
import { catalogSchema, projectConfigSchema } from './index';

const validConfig = {
  schemaVersion: 2,
  project: { name: 'commerce-app', blueprint: 'ecommerce', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: {
    language: 'typescript',
    backend: 'nestjs',
    frontend: 'vue-vite',
    database: 'postgresql',
    orm: 'prisma',
  },
  company: { mode: 'multi', superAdminScope: 'global' },
  features: { auth: true, rbac: true, navigation: 'dynamic', audit: true, redis: false, docker: true },
  theme: { preset: 'modern-saas', mode: 'light', primary: '#2563EB', accent: '#F59E0B' },
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

  it('rejects the old schema version after adding the required profile', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, schemaVersion: 1 }).success).toBe(false);
  });
});

export { validConfig };

describe('catalogSchema', () => {
  it('requires every wizard selection category and a reason for unavailable choices', () => {
    const categories = [
      'profiles', 'blueprints', 'shapes', 'layouts', 'languages', 'backends', 'frontends',
      'databases', 'orms', 'packageManagers', 'taskRunners', 'companyModes',
      'superAdminScopes', 'auth', 'rbac', 'navigation', 'audit', 'redis', 'docker', 'themes', 'themeModes',
    ];
    const complete = Object.fromEntries(categories.map(key => [key, [{ value: 'sample', label: 'Sample', available: true }]]));
    expect(catalogSchema.safeParse(complete).success).toBe(true);
    expect(catalogSchema.safeParse({ ...complete, backends: undefined }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...complete, auth: [{ value: 'true', label: 'Enabled', available: false }] }).success).toBe(false);
  });
});
