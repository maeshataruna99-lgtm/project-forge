import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

describe('role permissions', () => {
  it('grants members read access but no administrative actions', () => {
    const member = { userId: 'u1', companyId: 'c1', systemRole: 'member' as const };
    expect(hasPermission(member, 'projects:read')).toBe(true);
    expect(hasPermission(member, 'projects:write')).toBe(false);
    expect(hasPermission(member, 'users:manage')).toBe(false);
  });

  it('grants company administrators their company permissions and root all permissions', () => {
    const admin = { userId: 'u2', companyId: 'c1', systemRole: 'company-admin' as const };
    const root = { userId: 'u3', companyId: 'root', systemRole: 'root' as const };
    expect(hasPermission(admin, 'settings:manage')).toBe(true);
    expect(hasPermission(root, 'audit:read')).toBe(true);
    expect(hasPermission(admin, 'unknown:permission')).toBe(false);
  });
});
