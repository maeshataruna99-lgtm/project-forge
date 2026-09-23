import type { ProjectConfig } from '@project-forge/contracts';

export type CompatibilityIssue = {
  path: string;
  code: 'TEMPLATE_UNAVAILABLE' | 'FEATURE_UNAVAILABLE' | 'FEATURE_DEPENDENCY';
  message: string;
};

type Choice = { value: string; label: string; available: boolean; reason?: string };

const later = 'This option has no generator template yet. Choose the available option.';

export const catalog: {
  blueprints: Choice[];
  shapes: Choice[];
  layouts: Choice[];
  optionalFeatures: Choice[];
  themes: Choice[];
} = {
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
  optionalFeatures: [
    { value: 'redis', label: 'Redis', available: false, reason: later },
    { value: 'docker', label: 'Docker', available: false, reason: later },
  ],
  themes: [{ value: 'modern-saas', label: 'Modern SaaS', available: true }],
};

export function validateCompatibility(config: ProjectConfig): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const unavailable = (path: string, value: unknown) => {
    issues.push({ path, code: 'TEMPLATE_UNAVAILABLE', message: `${String(value)}: ${later}` });
  };

  if (config.project.blueprint !== 'blank-fullstack') unavailable('project.blueprint', config.project.blueprint);
  if (config.project.shape !== 'fullstack') unavailable('project.shape', config.project.shape);
  if (config.repository.layout !== 'monorepo') unavailable('repository.layout', config.repository.layout);

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
  for (const feature of ['redis', 'docker'] as const) {
    if (config.features[feature]) {
      issues.push({ path: `features.${feature}`, code: 'FEATURE_UNAVAILABLE', message: `${feature}: ${later}` });
    }
  }

  return issues;
}
