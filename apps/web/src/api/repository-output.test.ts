import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGitHubRepository, pollGitHubAuthorization, startGitHubAuthorization } from './repository-output';

const config = {
  schemaVersion: 3,
  project: { name: 'sample-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false, redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false, uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false },
  dataMode: 'api-backed', deploymentProfile: 'local', output: { destination: 'github' },
  theme: { preset: 'modern-saas', palette: 'blue', mode: 'light', primary: '#2563EB', accent: '#F59E0B', radius: 'medium', shadow: 'subtle', density: 'comfortable' },
} as const;

afterEach(() => vi.unstubAllGlobals());

describe('GitHub repository output API', () => {
  it('starts device authorization without exposing a GitHub token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ authorizationId: '00000000-0000-4000-8000-000000000001', userCode: 'ABCD-EFGH', verificationUri: 'https://github.com/login/device', interval: 5, expiresIn: 600 })));

    const result = await startGitHubAuthorization();

    expect(result.userCode).toBe('ABCD-EFGH');
    expect(JSON.stringify(result)).not.toContain('access_token');
  });

  it('polls using only the opaque authorization session id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'pending', interval: 5 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await pollGitHubAuthorization('00000000-0000-4000-8000-000000000001');

    expect(result.status).toBe('pending');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(JSON.stringify(fetchMock.mock.calls[0]?.[1])).not.toContain('access_token');
  });

  it('sends the confirmed destination and opaque session id without a credential', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: 'completed', repositoryUrl: 'https://github.com/cinder/sample-app' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await createGitHubRepository({ authorizationId: '00000000-0000-4000-8000-000000000001', owner: 'cinder', name: 'sample-app', confirmed: true, config });

    expect(result).toEqual({ status: 'completed', repositoryUrl: 'https://github.com/cinder/sample-app' });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ confirmed: true, authorizationId: '00000000-0000-4000-8000-000000000001', config: { output: { destination: 'github' } } });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain('access_token');
  });
});
