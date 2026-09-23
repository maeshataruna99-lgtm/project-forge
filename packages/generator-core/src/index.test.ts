import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { assertSafeArchivePath, ConfigurationError, createArchive, createPlan } from './index';

const config = {
  schemaVersion: 3,
  project: { name: 'sample-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false, redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false, uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false },
  dataMode: 'api-backed', deploymentProfile: 'local', output: { destination: 'zip' },
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

  it('rejects an unsupported configuration before rendering', () => {
    expect(() => createPlan({ ...config, features: { ...config.features, audit: true } })).toThrow(ConfigurationError);
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
  });

  it('produces the same file names and contents for repeated configurations', () => {
    const first = unzipSync(createArchive(config));
    const second = unzipSync(createArchive(config));
    expect(Object.keys(first)).toEqual(Object.keys(second));
    for (const path of Object.keys(first)) expect(first[path]).toEqual(second[path]);
  });
});
