import { z } from 'zod';
import type { ProjectConfig } from '@project-forge/contracts';

const deviceSchema = z.strictObject({
  authorizationId: z.string().uuid(),
  userCode: z.string(),
  verificationUri: z.literal('https://github.com/login/device'),
  interval: z.number().int().positive(),
  expiresIn: z.number().int().positive(),
});
const pollSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('pending'), interval: z.number().int().positive() }),
  z.strictObject({ status: z.literal('authorized') }),
  z.strictObject({ status: z.literal('expired') }),
]);
const outputSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('cancelled') }),
  z.strictObject({ status: z.literal('completed'), repositoryUrl: z.string().url() }),
  z.strictObject({ status: z.literal('unauthorized'), message: z.string() }),
  z.strictObject({ status: z.literal('create-failed'), message: z.string() }),
  z.strictObject({ status: z.literal('push-failed'), repositoryUrl: z.string().url(), message: z.string() }),
]);

async function post(url: string, body?: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null) as { code?: string } | null;
  if (!response.ok) throw new Error(payload?.code ?? `Request failed (${response.status})`);
  return payload;
}

export type GitHubAuthorization = z.infer<typeof deviceSchema>;
export type GitHubAuthorizationPoll = z.infer<typeof pollSchema>;
export type GitHubRepositoryOutput = z.infer<typeof outputSchema>;

export async function startGitHubAuthorization(): Promise<GitHubAuthorization> {
  return deviceSchema.parse(await post('/generator/github/device'));
}

export async function pollGitHubAuthorization(authorizationId: string): Promise<GitHubAuthorizationPoll> {
  return pollSchema.parse(await post('/generator/github/device/poll', { authorizationId }));
}

export async function createGitHubRepository(input: {
  authorizationId: string;
  owner: string;
  name: string;
  confirmed: boolean;
  config: ProjectConfig;
}): Promise<GitHubRepositoryOutput> {
  return outputSchema.parse(await post('/generator/github', { ...input, visibility: 'public' }));
}
