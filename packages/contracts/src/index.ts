import { z } from "zod";
export * from "./theme";

const projectName = z
  .string()
  .min(2)
  .max(50)
  .regex(
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens",
  )
  .refine(
    (name) => !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(name),
    "Use a name that is not reserved by Windows",
  );
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color");
export const uiLayoutSchema = z.enum([
  "single-column",
  "two-column",
  "grid",
  "split-screen",
  "magazine",
  "hero-landing",
]);
export type UiLayout = z.infer<typeof uiLayoutSchema>;

export const projectConfigSchema = z.strictObject({
  schemaVersion: z.literal(4),
  project: z.strictObject({
    name: projectName,
    blueprint: z.enum(["blank-fullstack", "ecommerce", "laravel-api"]),
    shape: z.enum(["api-only", "frontend-only", "fullstack"]),
    profile: z.enum(["minimal", "enterprise"]),
  }),
  repository: z.strictObject({
    layout: z.enum(["monorepo", "single-app"]),
    packageManager: z.enum(["pnpm", "composer"]),
    taskRunner: z.enum(["none", "turborepo"]),
  }),
  stack: z.strictObject({
    language: z.enum(["typescript", "php"]),
    backend: z.enum(["nestjs", "laravel", "none"]),
    frontend: z.enum(["vue-vite", "none"]),
    database: z.enum(["postgresql", "none"]),
    orm: z.enum(["prisma", "eloquent", "none"]),
  }),
  company: z.strictObject({
    mode: z.enum(["single", "multi"]),
    superAdminScope: z.enum(["global", "company"]),
  }),
  features: z.strictObject({
    auth: z.boolean(),
    authStrategy: z.enum(["jwt-refresh", "session"]),
    rbac: z.boolean(),
    navigation: z.enum(["dynamic", "none"]),
    audit: z.boolean(),
    redis: z.boolean(),
    docker: z.boolean(),
    queue: z.boolean(),
    realtime: z.boolean(),
    apiDocs: z.boolean(),
    smtp: z.boolean(),
    uploads: z.boolean(),
    generatedTests: z.boolean(),
    logging: z.boolean(),
    ciCd: z.boolean(),
    rateLimit: z.boolean(),
  }),
  dataMode: z.enum(["api-backed", "demo"]),
  deploymentProfile: z.enum(["local", "docker", "vercel", "vps"]),
  output: z.strictObject({ destination: z.enum(["zip", "github"]) }),
  ui: z.strictObject({
    layout: uiLayoutSchema,
  }),
  theme: z.strictObject({
    preset: z.enum([
      "modern-saas",
      "ecommerce-store",
      "admin-dashboard",
      "pos",
      "warehouse-industrial",
      "soft-pastel",
      "dark-developer",
      "corporate",
    ]),
    palette: z.enum(["blue", "emerald", "purple", "amber", "rose", "custom"]),
    mode: z.enum(["light", "dark"]),
    primary: color,
    accent: color,
    radius: z.enum(["none", "small", "medium", "large"]),
    shadow: z.enum(["none", "subtle", "medium", "strong"]),
    density: z.enum(["compact", "comfortable"]),
  }),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const catalogChoiceSchema = z
  .strictObject({
    value: z.string().min(1),
    label: z.string().min(1),
    available: z.boolean(),
    reason: z.string().min(1).optional(),
    requires: z
      .array(
        z.strictObject({
          path: z.string().min(1),
          equals: z.union([z.string(), z.boolean()]),
        }),
      )
      .optional(),
    conflicts: z
      .array(
        z.strictObject({
          path: z.string().min(1),
          equals: z.union([z.string(), z.boolean()]),
        }),
      )
      .optional(),
  })
  .refine((choice) => choice.available || choice.reason !== undefined, {
    message: "Unavailable choices need a reason",
    path: ["reason"],
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
  authStrategies: catalogCategorySchema,
  rbac: catalogCategorySchema,
  navigation: catalogCategorySchema,
  audit: catalogCategorySchema,
  redis: catalogCategorySchema,
  docker: catalogCategorySchema,
  queue: catalogCategorySchema,
  realtime: catalogCategorySchema,
  apiDocs: catalogCategorySchema,
  smtp: catalogCategorySchema,
  uploads: catalogCategorySchema,
  generatedTests: catalogCategorySchema,
  logging: catalogCategorySchema,
  ciCd: catalogCategorySchema,
  rateLimit: catalogCategorySchema,
  dataModes: catalogCategorySchema,
  deploymentProfiles: catalogCategorySchema,
  outputDestinations: catalogCategorySchema,
  uiLayouts: catalogCategorySchema,
  themes: catalogCategorySchema,
  palettes: catalogCategorySchema,
  themeModes: catalogCategorySchema,
  themeRadii: catalogCategorySchema,
  themeShadows: catalogCategorySchema,
  themeDensities: catalogCategorySchema,
  optionalFeatures: catalogCategorySchema.optional(),
});

export type GeneratorCatalog = z.infer<typeof catalogSchema>;
