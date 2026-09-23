import type { AuthIdentity } from '../auth/auth.service';

export const permissionCodes = ['projects:read', 'projects:write', 'users:manage', 'settings:manage', 'audit:read'] as const;
export type PermissionCode = typeof permissionCodes[number];

const rolePermissions: Record<AuthIdentity['systemRole'], readonly PermissionCode[]> = {
  member: ['projects:read'],
  'company-admin': ['projects:read', 'projects:write', 'users:manage', 'settings:manage', 'audit:read'],
  root: permissionCodes,
};

export function hasPermission(identity: AuthIdentity, permission: string): boolean {
  return rolePermissions[identity.systemRole].includes(permission as PermissionCode);
}
