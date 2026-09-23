import { describe, expect, it } from 'vitest';
import { projectConfigSchema } from './index';

const validConfig = {
  schemaVersion: 1,
  project: { name: 'commerce-app', blueprint: 'ecommerce', shape: 'fullstack' },
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

  it('rejects an invalid CSS color', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, theme: { ...validConfig.theme, primary: 'red; color: blue' } }).success).toBe(false);
  });

  it('rejects unknown configuration fields', () => {
    expect(projectConfigSchema.safeParse({ ...validConfig, unexpected: true }).success).toBe(false);
  });
});

export { validConfig };
