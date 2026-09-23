import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const secret = 'test-auth-secret-with-at-least-32-characters';

function createController() {
  let companyIndex = 0;
  const users = new Map<string, { id: string; email: string; passwordHash: string; memberships: Array<{ companyId: string; role: 'ADMIN' }> }>();
  const prisma = {
    user: { findUnique: vi.fn(async ({ where }: { where: { email: string } }) => users.get(where.email) ?? null) },
    $transaction: async (run: (transaction: unknown) => Promise<unknown>) => run({
      company: { create: async ({ data }: { data: { name: string } }) => ({ id: `company-${++companyIndex}`, ...data }) },
      user: { create: async ({ data }: { data: { email: string; passwordHash: string } }) => {
        const user = { id: `user-${companyIndex}`, ...data, memberships: [] as Array<{ companyId: string; role: 'ADMIN' }> };
        users.set(data.email, user);
        return user;
      } },
      companyMembership: { create: async ({ data }: { data: { userId: string; companyId: string; role: 'ADMIN' } }) => {
        const user = [...users.values()].find(candidate => candidate.id === data.userId)!;
        user.memberships.push({ companyId: data.companyId, role: data.role });
        return data;
      } },
    }),
  } as unknown as PrismaClient;
  return { controller: new AuthController(new AuthService(secret), prisma), users };
}

describe('auth controller', () => {
  it('registers a company admin, stores only a password hash, logs in, and refreshes tokens', async () => {
    const { controller, users } = createController();
    const registered = await controller.register({ companyName: 'Acme', email: 'Admin@Example.com', password: 'correct horse battery staple' });
    const user = users.get('admin@example.com')!;
    expect(user.passwordHash).not.toBe('correct horse battery staple');
    expect(registered).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });

    const loggedIn = await controller.login({ email: 'ADMIN@example.com', password: 'correct horse battery staple' });
    expect(loggedIn).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
    const refreshed = controller.refresh({ refreshToken: loggedIn.refreshToken });
    expect(refreshed).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
  });

  it('rejects weak registration input and invalid credentials', async () => {
    const { controller } = createController();
    await expect(controller.register({ companyName: 'A', email: 'bad', password: 'short' })).rejects.toThrow();
    await expect(controller.login({ email: 'missing@example.com', password: 'wrong password' })).rejects.toThrow();
    expect(() => controller.refresh({ refreshToken: 'tampered' })).toThrow();
  });
});
