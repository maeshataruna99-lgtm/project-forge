import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';

export type CompatibilityIssue = {
  path: string;
  code: 'INVALID_INPUT' | 'TEMPLATE_UNAVAILABLE' | 'FEATURE_UNAVAILABLE' | 'FEATURE_DEPENDENCY';
  message: string;
};

const later = 'This option has no generator template yet. Choose the available option.';

export const catalog: GeneratorCatalog = {
  profiles: [
    { value: 'minimal', label: 'Minimal', available: true },
    { value: 'enterprise', label: 'Enterprise', available: false, reason: later },
  ],
  blueprints: [
    { value: 'blank-fullstack', label: 'Blank Fullstack', available: true },
    { value: 'ecommerce', label: 'E-commerce', available: false, reason: later },
  ],
  shapes: [
    { value: 'fullstack', label: 'Fullstack', available: true },
    { value: 'api-only', label: 'API only', available: false, reason: later },
    { value: 'frontend-only', label: 'Frontend only', available: false, reason: later },
  ],
  layouts: [
    { value: 'monorepo', label: 'Monorepo', available: true },
    { value: 'single-app', label: 'Single app', available: false, reason: later },
  ],
  languages: [{ value: 'typescript', label: 'TypeScript', available: true }],
  backends: [
    { value: 'nestjs', label: 'NestJS', available: true },
    { value: 'none', label: 'No backend', available: false, reason: later },
  ],
  frontends: [
    { value: 'vue-vite', label: 'Vue and Vite', available: true },
    { value: 'none', label: 'No frontend', available: false, reason: later },
  ],
  databases: [
    { value: 'postgresql', label: 'PostgreSQL', available: true },
    { value: 'none', label: 'No database', available: false, reason: later },
  ],
  orms: [
    { value: 'prisma', label: 'Prisma', available: true },
    { value: 'none', label: 'No ORM', available: false, reason: later },
  ],
  packageManagers: [{ value: 'pnpm', label: 'pnpm', available: true }],
  taskRunners: [{ value: 'none', label: 'None', available: true }],
  companyModes: [
    { value: 'single', label: 'Single company', available: true },
    { value: 'multi', label: 'Multiple companies', available: false, reason: later },
  ],
  superAdminScopes: [
    { value: 'company', label: 'Company', available: true },
    { value: 'global', label: 'Global', available: false, reason: later },
  ],
  auth: [
    { value: 'false', label: 'Disabled', available: true },
    { value: 'true', label: 'Enabled', available: false, reason: later },
  ],
  rbac: [
    { value: 'false', label: 'Disabled', available: true },
    { value: 'true', label: 'Enabled', available: false, reason: later },
  ],
  navigation: [
    { value: 'none', label: 'None', available: true },
    { value: 'dynamic', label: 'Dynamic', available: false, reason: later },
  ],
  audit: [
    { value: 'false', label: 'Disabled', available: true },
    { value: 'true', label: 'Enabled', available: false, reason: later },
  ],
  redis: [
    { value: 'false', label: 'Disabled', available: true },
    { value: 'true', label: 'Enabled', available: false, reason: later },
  ],
  docker: [
    { value: 'false', label: 'Disabled', available: true },
    { value: 'true', label: 'Enabled', available: false, reason: later },
  ],
  optionalFeatures: [
    { value: 'redis', label: 'Redis', available: false, reason: later },
    { value: 'docker', label: 'Docker', available: false, reason: later },
  ],
  themes: [{ value: 'modern-saas', label: 'Modern SaaS', available: true }],
  themeModes: [
    { value: 'light', label: 'Light', available: true },
    { value: 'dark', label: 'Dark', available: true },
  ],
};

export function validateCompatibility(config: ProjectConfig): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const unavailable = (path: string, value: unknown) => {
    issues.push({ path, code: 'TEMPLATE_UNAVAILABLE', message: `${String(value)}: ${later}` });
  };

  if (config.project.blueprint !== 'blank-fullstack') unavailable('project.blueprint', config.project.blueprint);
  if (config.project.shape !== 'fullstack') unavailable('project.shape', config.project.shape);
  if (config.project.profile !== 'minimal') unavailable('project.profile', config.project.profile);
  if (config.repository.layout !== 'monorepo') unavailable('repository.layout', config.repository.layout);
  if (config.company.mode !== 'single') unavailable('company.mode', config.company.mode);
  if (config.company.superAdminScope !== 'company') unavailable('company.superAdminScope', config.company.superAdminScope);

  const supportedStack = {
    language: 'typescript',
    backend: 'nestjs',
    frontend: 'vue-vite',
    database: 'postgresql',
    orm: 'prisma',
  } as const;
  for (const field of Object.keys(supportedStack) as (keyof typeof supportedStack)[]) {
    if (config.stack[field] !== supportedStack[field]) unavailable(`stack.${field}`, config.stack[field]);
  }

  if (config.features.rbac && !config.features.auth) {
    issues.push({ path: 'features.auth', code: 'FEATURE_DEPENDENCY', message: 'RBAC requires authentication. Enable auth or disable RBAC.' });
  }
  if (config.features.navigation === 'dynamic' && !config.features.rbac) {
    issues.push({ path: 'features.rbac', code: 'FEATURE_DEPENDENCY', message: 'Dynamic navigation requires RBAC. Enable RBAC or disable dynamic navigation.' });
  }
  if (config.features.audit && !config.features.auth) {
    issues.push({ path: 'features.audit', code: 'FEATURE_DEPENDENCY', message: 'User audit events require authentication. Enable auth or disable audit.' });
  }
  for (const feature of ['auth', 'rbac', 'audit', 'redis', 'docker'] as const) {
    if (config.features[feature]) {
      issues.push({ path: `features.${feature}`, code: 'FEATURE_UNAVAILABLE', message: `${feature}: ${later}` });
    }
  }
  if (config.features.navigation === 'dynamic') {
    issues.push({ path: 'features.navigation', code: 'FEATURE_UNAVAILABLE', message: `dynamic navigation: ${later}` });
  }

  return issues;
}
