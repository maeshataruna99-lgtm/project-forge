import { randomUUID } from 'node:crypto';

type DeviceSession = {
  deviceCode: string;
  expiresAt: number;
  interval: number;
  nextPollAt: number;
  accessToken?: string;
  expiryTimer: ReturnType<typeof setTimeout>;
};

export type GitHubDeviceStart = {
  authorizationId: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  expiresIn: number;
};

export type GitHubDevicePoll = { status: 'pending'; interval: number } | { status: 'authorized' } | { status: 'expired' };

export class GitHubAuthorizationUnavailableError extends Error {
  constructor() {
    super('GitHub device authorization is not configured');
    this.name = 'GitHubAuthorizationUnavailableError';
  }
}

export class GitHubDeviceAuthorizationService {
  private readonly sessions = new Map<string, DeviceSession>();

  constructor(
    private readonly clientId = process.env.GITHUB_OAUTH_CLIENT_ID ?? '',
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async start(): Promise<GitHubDeviceStart> {
    if (!this.clientId) throw new GitHubAuthorizationUnavailableError();
    const response = await this.fetcher('https://github.com/login/device/code', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId, scope: 'public_repo' }),
    });
    if (!response.ok) throw new GitHubAuthorizationUnavailableError();
    const payload = await response.json() as Record<string, unknown>;
    if (typeof payload.device_code !== 'string' || typeof payload.user_code !== 'string' || payload.verification_uri !== 'https://github.com/login/device'
      || typeof payload.expires_in !== 'number' || typeof payload.interval !== 'number') {
      throw new GitHubAuthorizationUnavailableError();
    }
    this.discardExpired();
    const authorizationId = randomUUID();
    const expiresAt = this.now() + payload.expires_in * 1000;
    const session: DeviceSession = {
      deviceCode: payload.device_code,
      expiresAt,
      interval: Math.max(5, payload.interval),
      nextPollAt: this.now(),
      expiryTimer: setTimeout(() => this.sessions.delete(authorizationId), payload.expires_in * 1000),
    };
    session.expiryTimer.unref?.();
    this.sessions.set(authorizationId, session);
    return {
      authorizationId,
      userCode: payload.user_code,
      verificationUri: payload.verification_uri,
      interval: Math.max(5, payload.interval),
      expiresIn: payload.expires_in,
    };
  }

  async poll(authorizationId: string): Promise<GitHubDevicePoll> {
    const session = this.sessions.get(authorizationId);
    if (!session || session.expiresAt <= this.now()) {
      this.deleteSession(authorizationId);
      return { status: 'expired' };
    }
    if (session.accessToken) return { status: 'authorized' };
    if (this.now() < session.nextPollAt) return { status: 'pending', interval: session.interval };

    session.nextPollAt = this.now() + session.interval * 1000;
    const response = await this.fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId, device_code: session.deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }),
    });
    if (!response.ok) {
      this.deleteSession(authorizationId);
      return { status: 'expired' };
    }
    const payload = await response.json() as Record<string, unknown>;
    if (payload.error === 'slow_down') {
      session.interval += 5;
      session.nextPollAt = this.now() + session.interval * 1000;
    }
    if (payload.error === 'expired_token' || payload.error === 'access_denied') {
      this.deleteSession(authorizationId);
      return { status: 'expired' };
    }
    if (payload.error === 'authorization_pending' || payload.error === 'slow_down') return { status: 'pending', interval: session.interval };
    if (typeof payload.access_token !== 'string' || payload.token_type !== 'bearer' || !String(payload.scope ?? '').split(',').includes('public_repo')) {
      this.deleteSession(authorizationId);
      return { status: 'expired' };
    }
    session.accessToken = payload.access_token;
    return { status: 'authorized' };
  }

  consume(authorizationId: string): string | undefined {
    const session = this.sessions.get(authorizationId);
    this.deleteSession(authorizationId);
    return session && session.expiresAt > this.now() ? session.accessToken : undefined;
  }

  private discardExpired() {
    for (const [id, session] of this.sessions) if (session.expiresAt <= this.now()) this.deleteSession(id);
  }

  private deleteSession(id: string) {
    const session = this.sessions.get(id);
    if (session) clearTimeout(session.expiryTimer);
    this.sessions.delete(id);
  }
}
