import type { AuthIdentity } from '../auth/auth.service';
import { Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { hasPermission, type PermissionCode } from '../rbac/permissions';

export type NavigationItem = { key: string; label: string; href: string; permission: PermissionCode };

export const navigationItems: NavigationItem[] = [
  { key: 'projects', label: 'Projects', href: '/projects', permission: 'projects:read' },
  { key: 'team', label: 'Team', href: '/team', permission: 'users:manage' },
  { key: 'settings', label: 'Settings', href: '/settings', permission: 'settings:manage' },
  { key: 'audit', label: 'Audit log', href: '/audit', permission: 'audit:read' },
];

export function visibleNavigation(identity: AuthIdentity, items: NavigationItem[] = navigationItems): NavigationItem[] {
  return items.filter(item => hasPermission(identity, item.permission));
}

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(identity: AuthIdentity): Promise<NavigationItem[]> {
    const rows = await this.prisma.navigationItem.findMany({ orderBy: { sortOrder: 'asc' } });
    return visibleNavigation(identity, rows.map(row => ({
      key: row.key,
      label: row.label,
      href: row.href,
      permission: row.requiredPermission as PermissionCode,
    })));
  }
}
