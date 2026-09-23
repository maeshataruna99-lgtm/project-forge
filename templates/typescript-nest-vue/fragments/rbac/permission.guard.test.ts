import { describe, expect, it } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

function contextFor(user?: { userId: string; companyId: string; systemRole: 'member' | 'company-admin' | 'root' }): ExecutionContext {
  return {
    getHandler: () => ({}), getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('permission guard', () => {
  it('enforces route permissions using verified identity even when a client can see the route', () => {
    const reflector = { getAllAndOverride: () => 'projects:write' } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);
    expect(() => guard.canActivate(contextFor({ userId: 'u1', companyId: 'c1', systemRole: 'member' }))).toThrow(ForbiddenException);
    expect(guard.canActivate(contextFor({ userId: 'u2', companyId: 'c1', systemRole: 'company-admin' }))).toBe(true);
    expect(() => guard.canActivate(contextFor())).toThrow(ForbiddenException);
  });
});
