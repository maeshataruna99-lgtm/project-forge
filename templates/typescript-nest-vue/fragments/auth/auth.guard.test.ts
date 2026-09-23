import { describe, expect, it } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

const secret = 'test-auth-secret-with-at-least-32-characters';

function contextFor(request: { headers: { authorization?: string }; user?: unknown }): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('auth guard', () => {
  it('rejects missing and invalid credentials before protected handlers run', () => {
    const guard = new AuthGuard(new AuthService(secret));
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextFor({ headers: { authorization: 'Bearer invalid' } }))).toThrow(UnauthorizedException);
  });

  it('attaches only the verified token identity to the request', () => {
    const auth = new AuthService(secret);
    const identity = { userId: 'user-a', companyId: 'company-a', systemRole: 'company-admin' as const };
    const token = auth.issue(identity).accessToken;
    const request: { headers: { authorization?: string }; user?: unknown } = { headers: { authorization: `Bearer ${token}` } };
    expect(new AuthGuard(auth).canActivate(contextFor(request))).toBe(true);
    expect(request.user).toEqual(identity);
  });
});
