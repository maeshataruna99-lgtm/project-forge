import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';

export type CompatibilityIssue = {
  path: string;
  code: 'INVALID_INPUT' | 'TEMPLATE_UNAVAILABLE' | 'FEATURE_UNAVAILABLE' | 'FEATURE_DEPENDENCY';
  message: string;
};

const later = 'This option has no generator template yet. Choose the available option.';
const choices = (items: Array<[string, string]>, enabled: string[] = []) => items.map(([value, label]) => ({
  value, label, available: enabled.includes(value), ...(enabled.includes(value) ? {} : { reason: later }),
}));
const booleans = (enabled = false) => [
  { value: 'false', label: 'Disabled', available: true },
  { value: 'true', label: 'Enabled', available: enabled, ...(enabled ? {} : { reason: later }) },
];

export const catalog: GeneratorCatalog = {
  profiles: choices([['minimal', 'Minimal'], ['enterprise', 'Enterprise']], ['minimal']),
  blueprints: choices([['blank-fullstack', 'Blank Fullstack'], ['ecommerce', 'E-commerce']], ['blank-fullstack']),
  shapes: choices([['fullstack', 'Fullstack'], ['api-only', 'API only'], ['frontend-only', 'Frontend only']], ['fullstack']),
  layouts: choices([['monorepo', 'Monorepo'], ['single-app', 'Single app']], ['monorepo']),
  languages: choices([['typescript', 'TypeScript'], ['php', 'PHP']], ['typescript']),
  backends: choices([['nestjs', 'NestJS'], ['laravel', 'Laravel'], ['none', 'No backend']], ['nestjs']),
  frontends: choices([['vue-vite', 'Vue and Vite'], ['none', 'No frontend']], ['vue-vite']),
  databases: choices([['postgresql', 'PostgreSQL'], ['none', 'No database']], ['postgresql']),
  orms: choices([['prisma', 'Prisma'], ['eloquent', 'Eloquent'], ['none', 'No ORM']], ['prisma']),
  packageManagers: choices([['pnpm', 'pnpm']], ['pnpm']),
  taskRunners: choices([['none', 'None'], ['turborepo', 'Turborepo']], ['none']),
  companyModes: choices([['single', 'Single company'], ['multi', 'Multiple companies']], ['single']),
  superAdminScopes: choices([['company', 'Company'], ['global', 'Global']], ['company']),
  auth: booleans(), authStrategies: choices([['jwt-refresh', 'JWT with refresh tokens'], ['session', 'Session'] ], ['jwt-refresh']),
  rbac: booleans(), navigation: choices([['none', 'None'], ['dynamic', 'Dynamic']], ['none']),
  audit: booleans(), redis: booleans(), docker: booleans(), queue: booleans(), realtime: booleans(),
  apiDocs: booleans(), smtp: booleans(), uploads: booleans(), generatedTests: booleans(), logging: booleans(),
  ciCd: booleans(), rateLimit: booleans(),
  dataModes: choices([['api-backed', 'API-backed'], ['demo', 'Demo data']], ['api-backed']),
  deploymentProfiles: choices([['local', 'Local'], ['docker', 'Docker'], ['vercel', 'Vercel'], ['vps', 'VPS']], ['local']),
  outputDestinations: choices([['zip', 'Download ZIP'], ['github', 'Push to GitHub']], ['zip']),
  themes: choices([
    ['modern-saas', 'Modern SaaS'], ['ecommerce-store', 'E-commerce Store'], ['admin-dashboard', 'Admin Dashboard'],
    ['pos', 'POS'], ['warehouse-industrial', 'Warehouse Industrial'], ['soft-pastel', 'Soft Pastel'],
    ['dark-developer', 'Dark Developer'], ['corporate', 'Corporate'],
  ], ['modern-saas']),
  palettes: choices([['blue', 'Blue'], ['emerald', 'Emerald'], ['purple', 'Purple'], ['amber', 'Amber'], ['rose', 'Rose'], ['custom', 'Custom']], ['blue']),
  themeModes: choices([['light', 'Light'], ['dark', 'Dark']], ['light', 'dark']),
  themeRadii: choices([['none', 'None'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']], ['medium']),
  themeShadows: choices([['none', 'None'], ['subtle', 'Subtle'], ['medium', 'Medium'], ['strong', 'Strong']], ['subtle']),
  themeDensities: choices([['compact', 'Compact'], ['comfortable', 'Comfortable']], ['comfortable']),
  optionalFeatures: choices([['redis', 'Redis'], ['docker', 'Docker']]),
};

export function validateCompatibility(config: ProjectConfig): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const unavailable = (path: string, value: unknown) => {
    issues.push({ path, code: path.startsWith('features.') ? 'FEATURE_UNAVAILABLE' : 'TEMPLATE_UNAVAILABLE', message: `${String(value)}: ${later}` });
  };
  const matches = (path: string, value: string, supported: string) => { if (value !== supported) unavailable(path, value); };
  matches('project.blueprint', config.project.blueprint, 'blank-fullstack');
  matches('project.shape', config.project.shape, 'fullstack');
  matches('project.profile', config.project.profile, 'minimal');
  matches('repository.layout', config.repository.layout, 'monorepo');
  matches('repository.taskRunner', config.repository.taskRunner, 'none');
  matches('stack.language', config.stack.language, 'typescript');
  matches('stack.backend', config.stack.backend, 'nestjs');
  matches('stack.frontend', config.stack.frontend, 'vue-vite');
  matches('stack.database', config.stack.database, 'postgresql');
  matches('stack.orm', config.stack.orm, 'prisma');
  matches('company.mode', config.company.mode, 'single');
  matches('company.superAdminScope', config.company.superAdminScope, 'company');
  matches('features.authStrategy', config.features.authStrategy, 'jwt-refresh');
  matches('features.navigation', config.features.navigation, 'none');
  matches('dataMode', config.dataMode, 'api-backed');
  matches('deploymentProfile', config.deploymentProfile, 'local');
  matches('output.destination', config.output.destination, 'zip');
  matches('theme.preset', config.theme.preset, 'modern-saas');
  matches('theme.palette', config.theme.palette, 'blue');
  matches('theme.radius', config.theme.radius, 'medium');
  matches('theme.shadow', config.theme.shadow, 'subtle');
  matches('theme.density', config.theme.density, 'comfortable');

  if (config.features.rbac && !config.features.auth) issues.push({ path: 'features.auth', code: 'FEATURE_DEPENDENCY', message: 'RBAC requires authentication. Enable auth or disable RBAC.' });
  if (config.features.navigation === 'dynamic' && !config.features.rbac) issues.push({ path: 'features.rbac', code: 'FEATURE_DEPENDENCY', message: 'Dynamic navigation requires RBAC. Enable RBAC or disable dynamic navigation.' });
  if (config.features.audit && !config.features.auth) issues.push({ path: 'features.auth', code: 'FEATURE_DEPENDENCY', message: 'User audit events require authentication. Enable auth or disable audit.' });
  for (const feature of ['auth', 'rbac', 'audit', 'redis', 'docker', 'queue', 'realtime', 'apiDocs', 'smtp', 'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit'] as const) {
    if (config.features[feature]) unavailable(`features.${feature}`, true);
  }
  return issues;
}
