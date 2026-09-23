import { unzipSync } from 'fflate';
import { createArchiveAsync } from '@project-forge/generator-core';
import type { ProjectConfig } from '@project-forge/contracts';

export type RepositoryVisibility = 'public' | 'private';
export type GitHubRepository = { owner: string; name: string; url: string };
export type CreateRepositoryInput = {
  owner: string;
  name: string;
  visibility: RepositoryVisibility;
  accessToken: string;
};

export interface GitHubRepositoryProvider {
  createRepository(input: CreateRepositoryInput): Promise<GitHubRepository>;
  pushArchive(repository: GitHubRepository, archive: Uint8Array, accessToken: string): Promise<void>;
}

export type GitHubOutputResult =
  | { status: 'cancelled' }
  | { status: 'completed'; repositoryUrl: string }
  | { status: 'unauthorized'; message: string }
  | { status: 'create-failed'; message: string }
  | { status: 'push-failed'; repositoryUrl: string; message: string };

export type GitHubOutputInput = CreateRepositoryInput & {
  confirmed: boolean;
  config: ProjectConfig;
};

export class GitHubProviderError extends Error {
  constructor(public readonly status: number, message = 'GitHub request failed') {
    super(message);
    this.name = 'GitHubProviderError';
  }
}

function isGithubRepositoryUrl(value: string, owner: string, name: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com'
      && url.pathname.replace(/\/$/, '').toLowerCase() === `/${owner}/${name}`.toLowerCase();
  } catch {
    return false;
  }
}

export class GitHubRestRepositoryProvider implements GitHubRepositoryProvider {
  async createRepository(input: CreateRepositoryInput): Promise<GitHubRepository> {
    const user = await this.request('/user', input.accessToken);
    if (typeof user.login !== 'string') throw new Error('GitHub returned an invalid user record');
    const account = user.login;
    const endpoint = account.toLowerCase() === input.owner.toLowerCase()
      ? '/user/repos'
      : `/orgs/${encodeURIComponent(input.owner)}/repos`;
    const created = await this.request(endpoint, input.accessToken, {
      method: 'POST',
      body: JSON.stringify({ name: input.name, private: input.visibility === 'private', auto_init: false }),
    });
    const repositoryOwner = created.owner;
    if (typeof created.html_url !== 'string' || typeof created.name !== 'string' || typeof repositoryOwner !== 'object' || repositoryOwner === null
      || !('login' in repositoryOwner) || typeof repositoryOwner.login !== 'string'
      || !isGithubRepositoryUrl(created.html_url, repositoryOwner.login, created.name)) {
      throw new Error('GitHub returned an invalid repository record');
    }
    return { owner: repositoryOwner.login, name: created.name, url: created.html_url };
  }

  async pushArchive(repository: GitHubRepository, archive: Uint8Array, accessToken: string): Promise<void> {
    const files = unzipSync(archive);
    const paths = Object.keys(files);
    if (!paths.length || paths.length > 1000 || archive.byteLength > 20 * 1024 * 1024) throw new Error('Generated archive is outside GitHub upload limits');
    const tree = [] as { path: string; mode: '100644'; type: 'blob'; sha: string }[];
    let totalSize = 0;
    for (const path of paths) {
      if (path.startsWith('/') || path.includes('\\') || path.split('/').some(part => part === '..' || part === '.')) throw new Error('Generated archive contains an unsafe path');
      totalSize += files[path].byteLength;
      if (totalSize > 20 * 1024 * 1024) throw new Error('Generated files exceed GitHub upload limits');
      const content = Buffer.from(files[path]).toString('base64');
      const blob = await this.request(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/blobs`, accessToken, {
        method: 'POST', body: JSON.stringify({ content, encoding: 'base64' }),
      });
      if (typeof blob.sha !== 'string') throw new Error('GitHub did not return a file identifier');
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const base = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git`;
    const createdTree = await this.request(`${base}/trees`, accessToken, { method: 'POST', body: JSON.stringify({ tree }) });
    if (typeof createdTree.sha !== 'string') throw new Error('GitHub did not return a project tree identifier');
    const commit = await this.request(`${base}/commits`, accessToken, {
      method: 'POST', body: JSON.stringify({ message: 'Create starter project with Project Forge', tree: createdTree.sha }),
    });
    if (typeof commit.sha !== 'string') throw new Error('GitHub did not return a commit identifier');
    await this.request(`${base}/refs`, accessToken, { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha }) });
  }

  private async request(path: string, accessToken: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) throw new GitHubProviderError(response.status);
    return await response.json() as Record<string, unknown>;
  }
}

export class GithubOutputService {
  constructor(
    private readonly provider: GitHubRepositoryProvider = new GitHubRestRepositoryProvider(),
    private readonly archiveBuilder: (config: unknown) => Promise<Uint8Array> = createArchiveAsync,
  ) {}

  async create(input: GitHubOutputInput): Promise<GitHubOutputResult> {
    if (!input.confirmed) return { status: 'cancelled' };
    let archive: Uint8Array;
    try {
      archive = await this.archiveBuilder(input.config);
    } catch {
      return { status: 'create-failed', message: 'The project archive could not be prepared. Download the ZIP and try again.' };
    }
    let repository: GitHubRepository;
    try {
      repository = await this.provider.createRepository({
        owner: input.owner,
        name: input.name,
        visibility: input.visibility,
        accessToken: input.accessToken,
      });
    } catch (error) {
      if (error instanceof GitHubProviderError && (error.status === 401 || error.status === 403)) {
        return { status: 'unauthorized', message: 'GitHub authorization failed. Download the ZIP or reconnect.' };
      }
      return { status: 'create-failed', message: 'GitHub could not create the repository. Download the ZIP or try again.' };
    }
    try {
      await this.provider.pushArchive(repository, archive, input.accessToken);
      return { status: 'completed', repositoryUrl: repository.url };
    } catch {
      return {
        status: 'push-failed', repositoryUrl: repository.url,
        message: 'The repository exists, but the project files were not pushed. Download the ZIP and upload it to the repository.',
      };
    }
  }
}
