const permissions = [
  ['projects:read', 'Read projects'],
  ['projects:write', 'Create and update projects'],
  ['users:manage', 'Manage company members'],
  ['settings:manage', 'Manage company settings'],
  ['audit:read', 'Read company audit events'],
  ...__ECOMMERCE_SEED_PERMISSIONS__,
];

const grants = {
  MEMBER: ['projects:read', ...__ECOMMERCE_MEMBER_CODES__],
  ADMIN: permissions.map(([code]) => code),
};

const navigation = [
  ['projects', 'Projects', '/projects', 'projects:read', 10],
  ['team', 'Team', '/team', 'users:manage', 20],
  ['settings', 'Settings', '/settings', 'settings:manage', 30],
  ['audit', 'Audit log', '/audit', 'audit:read', 40],
  ...__ECOMMERCE_SEED_NAVIGATION__,
];

export async function seedAccessControl(prisma, { seedNavigation = false } = {}) {
  const ids = new Map();
  for (const [code, description] of permissions) {
    const row = await prisma.permission.upsert({ where: { code }, update: { description }, create: { code, description } });
    ids.set(code, row.id);
  }
  for (const [role, codes] of Object.entries(grants)) {
    for (const code of codes) {
      const permissionId = ids.get(code);
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        update: {},
        create: { role, permissionId },
      });
    }
  }
  if (seedNavigation) {
    for (const [key, label, href, requiredPermission, sortOrder] of navigation) {
      await prisma.navigationItem.upsert({
        where: { key },
        update: { label, href, requiredPermission, sortOrder },
        create: { key, label, href, requiredPermission, sortOrder },
      });
    }
  }
}
