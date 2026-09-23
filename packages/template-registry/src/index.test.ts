import { describe, expect, it } from 'vitest';
import type { ProjectConfig } from '@project-forge/contracts';
import { catalog, validateCompatibility } from './index';

const base: ProjectConfig = {
  schemaVersion: 2,
  project: { name: 'my-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, rbac: false, navigation: 'none', audit: false, redis: false, docker: false },
  theme: { preset: 'modern-saas', mode: 'light', primary: '#2563EB', accent: '#F59E0B' },
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
});
