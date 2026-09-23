import { afterEach, describe, expect, it, vi } from 'vitest';
import { zipSync } from 'fflate';
import { GithubOutputService, GitHubProviderError, GitHubRestRepositoryProvider, type GitHubRepositoryProvider } from './github-output.service';

const archive = new Uint8Array([80, 75, 3, 4]);
const config = { project: { name: 'sample-app' } } as never;
afterEach(() => vi.unstubAllGlobals());

function provider(): GitHubRepositoryProvider {
  return {
    createRepository: vi.fn().mockResolvedValue({ owner: 'cinder', name: 'sample-app', url: 'https://github.com/cinder/sample-app' }),
    pushArchive: vi.fn().mockResolvedValue(undefined),
  };
}

describe('GithubOutputService', () => {
  it('does not create a repository when the user cancels', async () => {
    const github = provider();
    const service = new GithubOutputService(github, async () => archive);

    const result = await service.create({ confirmed: false, owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token', config });

    expect(result.status).toBe('cancelled');
    expect(github.createRepository).not.toHaveBeenCalled();
  });

  it('creates a public repository and pushes an archive as a single initial commit', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ login: 'cinder' }))
      .mockResolvedValueOnce(Response.json({ name: 'sample-app', html_url: 'https://github.com/cinder/sample-app', owner: { login: 'cinder' } }))
      .mockResolvedValueOnce(Response.json({ sha: 'blob-sha' }))
      .mockResolvedValueOnce(Response.json({ sha: 'tree-sha' }))
      .mockResolvedValueOnce(Response.json({ sha: 'commit-sha' }))
      .mockResolvedValueOnce(Response.json({ ref: 'refs/heads/main' }));
    vi.stubGlobal('fetch', fetchMock);
    const provider = new GitHubRestRepositoryProvider();
    const repository = await provider.createRepository({ owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token' });

    await provider.pushArchive(repository, zipSync({ 'README.md': new TextEncoder().encode('# Starter') }), 'secret-token');

    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      'https://api.github.com/user',
      'https://api.github.com/user/repos',
      'https://api.github.com/repos/cinder/sample-app/git/blobs',
      'https://api.github.com/repos/cinder/sample-app/git/trees',
      'https://api.github.com/repos/cinder/sample-app/git/commits',
      'https://api.github.com/repos/cinder/sample-app/git/refs',
    ]);
    expect(fetchMock.mock.calls.every(([, init]) => (init?.headers as Record<string, string>).Authorization === 'Bearer secret-token')).toBe(true);
    expect(String(fetchMock.mock.calls[3]?.[1]?.body)).toContain('blob-sha');
    expect(String(fetchMock.mock.calls[4]?.[1]?.body)).toContain('tree-sha');
    expect(String(fetchMock.mock.calls[5]?.[1]?.body)).toContain('commit-sha');
  });

  it('rejects a repository URL outside GitHub before returning it to the browser', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ login: 'cinder' }))
      .mockResolvedValueOnce(Response.json({ name: 'sample-app', html_url: 'https://attacker.example/cinder/sample-app', owner: { login: 'cinder' } }));
    vi.stubGlobal('fetch', fetchMock);
    const provider = new GitHubRestRepositoryProvider();

    await expect(provider.createRepository({ owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token' }))
      .rejects.toThrow('GitHub returned an invalid repository record');
  });

  it('creates and pushes the generated archive through the provider', async () => {
    const github = provider();
    const buildArchive = vi.fn().mockResolvedValue(archive);
    const service = new GithubOutputService(github, buildArchive);

    const result = await service.create({ confirmed: true, owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token', config });

    expect(result).toEqual({ status: 'completed', repositoryUrl: 'https://github.com/cinder/sample-app' });
    expect(buildArchive).toHaveBeenCalledWith(config);
    expect(github.createRepository).toHaveBeenCalledWith({ owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token' });
    expect(github.pushArchive).toHaveBeenCalledWith(expect.objectContaining({ name: 'sample-app' }), archive, 'secret-token');
  });

  it('reports unauthorized credentials without exposing provider errors or the token', async () => {
    const github = provider();
    vi.mocked(github.createRepository).mockRejectedValue(new GitHubProviderError(401, 'secret-token was rejected'));
    const service = new GithubOutputService(github, async () => archive);

    const result = await service.create({ confirmed: true, owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token', config });

    expect(result).toEqual({ status: 'unauthorized', message: 'GitHub authorization failed. Download the ZIP or reconnect.' });
    expect(JSON.stringify(result)).not.toContain('secret-token');
  });

  it('returns a recovery link when repository creation succeeds but push fails', async () => {
    const github = provider();
    vi.mocked(github.pushArchive).mockRejectedValue(new Error('network failed'));
    const service = new GithubOutputService(github, async () => archive);

    const result = await service.create({ confirmed: true, owner: 'cinder', name: 'sample-app', visibility: 'public', accessToken: 'secret-token', config });

    expect(result).toEqual({ status: 'push-failed', repositoryUrl: 'https://github.com/cinder/sample-app', message: 'The repository exists, but the project files were not pushed. Download the ZIP and upload it to the repository.' });
    expect(JSON.stringify(result)).not.toContain('secret-token');
  });
});
