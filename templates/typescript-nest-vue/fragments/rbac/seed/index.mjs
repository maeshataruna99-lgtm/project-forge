import { PrismaClient } from '@prisma/client';
import { seedAccessControl } from './access-control.mjs';

const prisma = new PrismaClient();
try {
  await seedAccessControl(prisma, { seedNavigation: __SEED_NAVIGATION__ });
} finally {
  await prisma.$disconnect();
}
