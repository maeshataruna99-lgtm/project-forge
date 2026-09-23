import { z } from 'zod';

const projectName = z.string().min(2).max(50)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens')
  .refine(name => !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(name), 'Use a name that is not reserved by Windows');
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color');

export const projectConfigSchema = z.strictObject({
  schemaVersion: z.literal(2),
  project: z.strictObject({
    name: projectName,
    blueprint: z.enum(['blank-fullstack', 'ecommerce']),
    shape: z.enum(['api-only', 'frontend-only', 'fullstack']),
    profile: z.enum(['minimal', 'enterprise']),
  }),
  repository: z.strictObject({
    layout: z.enum(['monorepo', 'single-app']),
    packageManager: z.enum(['pnpm']),
    taskRunner: z.enum(['none']),
  }),
  stack: z.strictObject({
    language: z.enum(['typescript']),
    backend: z.enum(['nestjs', 'none']),
    frontend: z.enum(['vue-vite', 'none']),
    database: z.enum(['postgresql', 'none']),
    orm: z.enum(['prisma', 'none']),
  }),
  company: z.strictObject({
    mode: z.enum(['single', 'multi']),
    superAdminScope: z.enum(['global', 'company']),
  }),
  features: z.strictObject({
    auth: z.boolean(),
    rbac: z.boolean(),
    navigation: z.enum(['dynamic', 'none']),
    audit: z.boolean(),
    redis: z.boolean(),
    docker: z.boolean(),
  }),
  theme: z.strictObject({
    preset: z.enum(['modern-saas']),
    mode: z.enum(['light', 'dark']),
    primary: color,
    accent: color,
  }),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const catalogChoiceSchema = z.strictObject({
  value: z.string().min(1),
  label: z.string().min(1),
  available: z.boolean(),
  reason: z.string().min(1).optional(),
}).refine(choice => choice.available || choice.reason !== undefined, {
  message: 'Unavailable choices need a reason',
  path: ['reason'],
});

export const catalogCategorySchema = z.array(catalogChoiceSchema).min(1);

export const catalogSchema = z.strictObject({
  profiles: catalogCategorySchema,
  blueprints: catalogCategorySchema,
  shapes: catalogCategorySchema,
  layouts: catalogCategorySchema,
  languages: catalogCategorySchema,
  backends: catalogCategorySchema,
  frontends: catalogCategorySchema,
  databases: catalogCategorySchema,
  orms: catalogCategorySchema,
  packageManagers: catalogCategorySchema,
  taskRunners: catalogCategorySchema,
  companyModes: catalogCategorySchema,
  superAdminScopes: catalogCategorySchema,
  auth: catalogCategorySchema,
  rbac: catalogCategorySchema,
  navigation: catalogCategorySchema,
  audit: catalogCategorySchema,
  redis: catalogCategorySchema,
  docker: catalogCategorySchema,
  themes: catalogCategorySchema,
  themeModes: catalogCategorySchema,
  optionalFeatures: catalogCategorySchema.optional(),
});

export type GeneratorCatalog = z.infer<typeof catalogSchema>;
