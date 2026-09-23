import { describe, expect, it } from 'vitest';
import { NavigationService, visibleNavigation } from './navigation.service';

describe('permission-filtered navigation', () => {
  it('shows only items the verified role may access', () => {
    const member = { userId: 'u1', companyId: 'c1', systemRole: 'member' as const };
    const admin = { userId: 'u2', companyId: 'c1', systemRole: 'company-admin' as const };
    expect(visibleNavigation(member).map(item => item.key)).toEqual(['projects']);
    expect(visibleNavigation(admin).map(item => item.key)).toEqual(['projects', 'team', 'settings', 'audit']);
  });

  it('loads the persisted menu and filters it with the same server permission map', async () => {
    const service = new NavigationService({
      navigationItem: { findMany: async () => [
        { key: 'team', label: 'Team', href: '/team', requiredPermission: 'users:manage' },
        { key: 'projects', label: 'Projects', href: '/projects', requiredPermission: 'projects:read' },
      ] },
    } as never);
    const member = { userId: 'u1', companyId: 'c1', systemRole: 'member' as const };
    expect((await service.list(member)).map(item => item.key)).toEqual(['projects']);
  });
});
