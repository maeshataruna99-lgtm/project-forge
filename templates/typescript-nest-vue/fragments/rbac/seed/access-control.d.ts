declare module '*.mjs' {
  export function seedAccessControl(prisma: unknown, options?: { seedNavigation?: boolean }): Promise<void>;
}
