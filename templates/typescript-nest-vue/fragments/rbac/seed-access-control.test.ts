import { describe, expect, it } from 'vitest';
import { seedAccessControl } from './seed-access-control.mjs';

describe('access-control seed', () => {
  it('uses upserts so repeating a seed does not duplicate permissions or navigation', async () => {
    const permissions = new Map<string, { id: string; code: string }>();
    const grants = new Set<string>();
    const navigation = new Map<string, { key: string }>();
    const prisma = {
      permission: { upsert: async ({ where, create }: { where: { code: string }; create: { code: string } }) => {
        const saved = permissions.get(where.code) ?? { id: `permission-${where.code}`, code: create.code };
        permissions.set(where.code, saved);
        return saved;
      } },
      rolePermission: { upsert: async ({ where, create }: { where: { role_permissionId: { role: string; permissionId: string } }; create: { role: string; permissionId: string } }) => {
        grants.add(`${where.role_permissionId.role}:${where.role_permissionId.permissionId}`);
        return create;
      } },
      navigationItem: { upsert: async ({ where, create }: { where: { key: string }; create: { key: string } }) => {
        const saved = navigation.get(where.key) ?? create;
        navigation.set(where.key, saved);
        return saved;
      } },
    };
    await seedAccessControl(prisma, { seedNavigation: true });
    const totals = [permissions.size, grants.size, navigation.size];
    await seedAccessControl(prisma, { seedNavigation: true });
    expect([permissions.size, grants.size, navigation.size]).toEqual(totals);
    expect(navigation.size).toBe(__ECOMMERCE_NAVIGATION_COUNT__);
  });
});
