import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectConfig } from '@project-forge/contracts';
import { downloadArchive, fetchCatalog, GeneratorApiError, validateConfig } from './generator';

const config: ProjectConfig = {
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

const categories = [
  'profiles', 'blueprints', 'shapes', 'layouts', 'languages', 'backends', 'frontends',
  'databases', 'orms', 'packageManagers', 'taskRunners', 'companyModes',
  'superAdminScopes', 'auth', 'authStrategies', 'rbac', 'navigation', 'audit', 'redis', 'docker',
  'queue', 'realtime', 'apiDocs', 'smtp', 'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit',
  'dataModes', 'deploymentProfiles', 'outputDestinations', 'uiLayouts', 'themes', 'palettes', 'themeModes',
  'themeRadii', 'themeShadows', 'themeDensities',
] as const;
const catalog = Object.fromEntries(categories.map(key => [key, [{ value: 'minimal', label: 'Minimal', available: true }]]));

afterEach(() => vi.unstubAllGlobals());

describe('generator HTTP client', () => {
  it('parses the catalog and rejects an invalid catalog', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json({ profiles: [] }));
    vi.stubGlobal('fetch', fetch);
    expect(await fetchCatalog()).toEqual(catalog);
    await expect(fetchCatalog()).rejects.toThrow();
    expect(fetch).toHaveBeenCalledWith('/generator/catalog');
  });

  it('posts configuration JSON and parses the validation plan', async () => {
    const plan = {
      templatePack: 'typescript-nest-vue',
      projectName: 'sample-app',
      profile: 'minimal',
      blueprint: 'blank-fullstack',
      shape: 'fullstack',
      layout: 'monorepo',
      capabilities: [],
      features: config.features,
      stack: config.stack,
      company: config.company,
      dataMode: config.dataMode,
      deploymentProfile: config.deploymentProfile,
      outputDestination: config.output.destination,
      uiLayout: config.ui.layout,
      files: ['apps/web/src/App.vue'],
      theme: config.theme,
    };
    const fetch = vi.fn().mockResolvedValue(Response.json(plan));
    vi.stubGlobal('fetch', fetch);
    expect(await validateConfig(config)).toEqual(plan);
    expect(fetch).toHaveBeenCalledWith('/generator/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
  });

  it('exposes status, field issues, and correlation ID from an API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'INVALID_CONFIGURATION', issues: [{ path: 'features.audit', message: 'Unsupported' }], correlationId: 'request-123' }, { status: 400 })));
    await expect(validateConfig(config)).rejects.toMatchObject({ status: 400, code: 'INVALID_CONFIGURATION', issues: [{ path: 'features.audit', message: 'Unsupported' }], correlationId: 'request-123' });
  });

  it('reports a readable error when the server returns non-JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })));
    await expect(validateConfig(config)).rejects.toBeInstanceOf(GeneratorApiError);
    await expect(validateConfig(config)).rejects.toThrow(/503/);
  });

  it('wraps network failures as readable API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchCatalog()).rejects.toMatchObject({ name: 'GeneratorApiError', message: 'Failed to fetch' });
  });

  it('exposes archive failure details for a retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'GENERATOR_BUSY', correlationId: 'request-456' }, { status: 429 })));
    await expect(downloadArchive(config)).rejects.toMatchObject({ status: 429, code: 'GENERATOR_BUSY', correlationId: 'request-456' });
  });

  it('returns ZIP data and a filename from Content-Disposition', async () => {
    const bytes = new Uint8Array([80, 75]);
    const fetch = vi.fn().mockResolvedValue(new Response(bytes, { status: 201, headers: { 'Content-Disposition': 'attachment; filename="generated-app.zip"' } }));
    vi.stubGlobal('fetch', fetch);
    const result = await downloadArchive(config);
    expect(result.filename).toBe('generated-app.zip');
    expect([...new Uint8Array(await result.blob.arrayBuffer())]).toEqual([80, 75]);
    expect(fetch).toHaveBeenCalledWith('/generator/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
  });

  it.each([undefined, 'attachment; filename="../../unsafe.zip"', 'attachment; filename="bad.txt"'])('falls back to project ZIP name for absent or unsafe filename %s', async disposition => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([80, 75]), { status: 201, headers: disposition ? { 'Content-Disposition': disposition } : {} })));
    expect((await downloadArchive(config)).filename).toBe('sample-app.zip');
  });
});
