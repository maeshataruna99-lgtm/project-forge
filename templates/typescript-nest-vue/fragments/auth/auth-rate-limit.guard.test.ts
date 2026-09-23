import { describe, expect, it } from 'vitest';
import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('auth rate limit guard', () => {
  it('caps authentication attempts per client and route within a fixed window', () => {
    const guard = new AuthRateLimitGuard();
    const request = { ip: '127.0.0.1', path: '/auth/login', route: { path: '/login' }, socket: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    for (let attempt = 0; attempt < 20; attempt += 1) expect(guard.canActivate(context)).toBe(true);
    try {
      guard.canActivate(context);
      throw new Error('Expected the request to be rate limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});
