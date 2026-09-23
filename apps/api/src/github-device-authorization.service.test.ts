import { describe, expect, it, vi } from 'vitest';
import { GitHubDeviceAuthorizationService } from './github-device-authorization.service';

describe('GitHubDeviceAuthorizationService', () => {
  it('keeps GitHub device codes server-side and only returns the user code', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({
      device_code: 'device-secret', user_code: 'ABCD-EFGH', verification_uri: 'https://github.com/login/device', expires_in: 600, interval: 5,
    }));
    const service = new GitHubDeviceAuthorizationService('client-id', fetcher);

    const result = await service.start();

    expect(result).toMatchObject({ userCode: 'ABCD-EFGH', verificationUri: 'https://github.com/login/device', interval: 5, expiresIn: 600 });
    expect(JSON.stringify(result)).not.toContain('device-secret');
    expect(fetcher).toHaveBeenCalledWith('https://github.com/login/device/code', expect.objectContaining({ method: 'POST' }));
  });

  it('keeps a polled access token private and consumes it once', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ device_code: 'device-secret', user_code: 'ABCD-EFGH', verification_uri: 'https://github.com/login/device', expires_in: 600, interval: 5 }))
      .mockResolvedValueOnce(Response.json({ error: 'authorization_pending' }))
      .mockResolvedValueOnce(Response.json({ access_token: 'access-secret', token_type: 'bearer', scope: 'public_repo' }));
    let now = 0;
    const service = new GitHubDeviceAuthorizationService('client-id', fetcher, () => now);
    const session = await service.start();

    expect(await service.poll(session.authorizationId)).toEqual({ status: 'pending', interval: 5 });
    now = 5000;
    expect(await service.poll(session.authorizationId)).toEqual({ status: 'authorized' });
    expect(JSON.stringify(await service.poll(session.authorizationId))).not.toContain('access-secret');
    expect(await service.consume(session.authorizationId)).toBe('access-secret');
    expect(await service.consume(session.authorizationId)).toBeUndefined();
  });

  it('rejects unknown authorization sessions without contacting GitHub', async () => {
    const fetcher = vi.fn();
    const service = new GitHubDeviceAuthorizationService('client-id', fetcher);

    expect(await service.poll('unknown')).toEqual({ status: 'expired' });
    expect(await service.consume('unknown')).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('respects GitHub slow_down intervals before polling again', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ device_code: 'device-secret', user_code: 'ABCD-EFGH', verification_uri: 'https://github.com/login/device', expires_in: 600, interval: 5 }))
      .mockResolvedValueOnce(Response.json({ error: 'slow_down' }))
      .mockResolvedValueOnce(Response.json({ access_token: 'access-secret', token_type: 'bearer', scope: 'public_repo' }));
    let now = 0;
    const service = new GitHubDeviceAuthorizationService('client-id', fetcher, () => now);
    const session = await service.start();

    expect(await service.poll(session.authorizationId)).toEqual({ status: 'pending', interval: 10 });
    now = 5000;
    expect(await service.poll(session.authorizationId)).toEqual({ status: 'pending', interval: 10 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    now = 10000;
    expect(await service.poll(session.authorizationId)).toEqual({ status: 'authorized' });
  });
});
