import { PrismaClient } from '@prisma/client';
import { seedAccessControl } from '../apps/api/src/rbac/seed-access-control.mjs';

const prisma = new PrismaClient();
try {
  await seedAccessControl(prisma, { seedNavigation: __SEED_NAVIGATION__ });
} finally {
  await prisma.$disconnect();
}
