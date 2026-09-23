import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import { themePresets } from '@project-forge/contracts';

export type CompatibilityIssue = {
  path: string;
  code: 'INVALID_INPUT' | 'TEMPLATE_UNAVAILABLE' | 'FEATURE_UNAVAILABLE' | 'FEATURE_DEPENDENCY';
  message: string;
};

export type TemplatePackId = 'typescript-nest-vue' | 'php-laravel';

export const templatePacks: Record<TemplatePackId, { language: ProjectConfig['stack']['language']; backend: ProjectConfig['stack']['backend'] }> = {
  'typescript-nest-vue': { language: 'typescript', backend: 'nestjs' },
  'php-laravel': { language: 'php', backend: 'laravel' },
};

export function resolveTemplatePack(config: ProjectConfig): TemplatePackId {
  return config.stack.language === 'php' && config.stack.backend === 'laravel' ? 'php-laravel' : 'typescript-nest-vue';
}

const later = 'This option has no generator template yet. Choose the available option.';
const choices = (
  items: Array<[string, string]>,
  enabled: string[] = [],
  requiresByValue: Record<string, Array<{ path: string; equals: string | boolean }>> = {},
  conflictsByValue: Record<string, Array<{ path: string; equals: string | boolean }>> = {},
) => items.map(([value, label]) => ({
  value, label, available: enabled.includes(value), ...(enabled.includes(value) ? {} : { reason: later }),
  ...(requiresByValue[value] ? { requires: requiresByValue[value] } : {}),
  ...(conflictsByValue[value] ? { conflicts: conflictsByValue[value] } : {}),
}));
const booleans = (enabled = false, requirements: Array<{ path: string; equals: string | boolean }> = []) => [
  { value: 'false', label: 'Disabled', available: true },
  { value: 'true', label: 'Enabled', available: enabled, ...(enabled ? (requirements.length ? { requires: requirements } : {}) : { reason: later }) },
];

export const catalog: GeneratorCatalog = {
  profiles: choices([['minimal', 'Minimal'], ['enterprise', 'Enterprise']], ['minimal', 'enterprise']),
  blueprints: choices([['blank-fullstack', 'Blank Fullstack'], ['ecommerce', 'E-commerce'], ['laravel-api', 'Laravel API']], ['blank-fullstack', 'ecommerce', 'laravel-api'], {
    ecommerce: [{ path: 'project.shape', equals: 'fullstack' }, { path: 'repository.layout', equals: 'monorepo' }],
    'laravel-api': [
      { path: 'project.profile', equals: 'minimal' }, { path: 'stack.language', equals: 'php' },
      { path: 'stack.backend', equals: 'laravel' }, { path: 'project.shape', equals: 'api-only' },
      { path: 'repository.layout', equals: 'single-app' }, { path: 'repository.packageManager', equals: 'composer' },
      { path: 'stack.frontend', equals: 'none' }, { path: 'stack.database', equals: 'postgresql' },
      { path: 'stack.orm', equals: 'eloquent' }, { path: 'company.mode', equals: 'single' },
      { path: 'company.superAdminScope', equals: 'company' }, { path: 'deploymentProfile', equals: 'local' },
      { path: 'dataMode', equals: 'api-backed' },
    ],
  }),
  shapes: choices([['fullstack', 'Fullstack'], ['api-only', 'API only'], ['frontend-only', 'Frontend only']], ['fullstack', 'api-only', 'frontend-only'], {
    'api-only': [{ path: 'stack.backend', equals: 'nestjs' }, { path: 'stack.frontend', equals: 'none' }],
    'frontend-only': [
      { path: 'stack.backend', equals: 'none' }, { path: 'stack.frontend', equals: 'vue-vite' },
      { path: 'stack.database', equals: 'none' }, { path: 'stack.orm', equals: 'none' }, { path: 'dataMode', equals: 'demo' },
    ],
  }),
  layouts: choices([['monorepo', 'Monorepo'], ['single-app', 'Single app']], ['monorepo', 'single-app'], {}, {
    'single-app': [{ path: 'project.shape', equals: 'fullstack' }],
  }),
  languages: choices([['typescript', 'TypeScript'], ['php', 'PHP']], ['typescript', 'php'], {
    php: [
      { path: 'project.blueprint', equals: 'laravel-api' }, { path: 'project.shape', equals: 'api-only' },
      { path: 'project.profile', equals: 'minimal' }, { path: 'repository.layout', equals: 'single-app' },
      { path: 'repository.packageManager', equals: 'composer' }, { path: 'repository.taskRunner', equals: 'none' },
      { path: 'stack.backend', equals: 'laravel' }, { path: 'stack.frontend', equals: 'none' },
      { path: 'stack.database', equals: 'postgresql' }, { path: 'stack.orm', equals: 'eloquent' },
      { path: 'company.mode', equals: 'single' }, { path: 'company.superAdminScope', equals: 'company' },
      { path: 'deploymentProfile', equals: 'local' }, { path: 'dataMode', equals: 'api-backed' },
    ],
  }),
  backends: choices([['nestjs', 'NestJS'], ['laravel', 'Laravel'], ['none', 'No backend']], ['nestjs', 'laravel', 'none'], {
    laravel: [
      { path: 'project.blueprint', equals: 'laravel-api' }, { path: 'stack.language', equals: 'php' },
      { path: 'project.shape', equals: 'api-only' }, { path: 'project.profile', equals: 'minimal' },
      { path: 'repository.layout', equals: 'single-app' }, { path: 'repository.packageManager', equals: 'composer' },
      { path: 'repository.taskRunner', equals: 'none' }, { path: 'stack.frontend', equals: 'none' },
      { path: 'stack.database', equals: 'postgresql' }, { path: 'stack.orm', equals: 'eloquent' },
      { path: 'company.mode', equals: 'single' }, { path: 'company.superAdminScope', equals: 'company' },
      { path: 'deploymentProfile', equals: 'local' }, { path: 'dataMode', equals: 'api-backed' },
    ],
    none: [
    { path: 'project.shape', equals: 'frontend-only' }, { path: 'stack.frontend', equals: 'vue-vite' }, { path: 'stack.database', equals: 'none' }, { path: 'stack.orm', equals: 'none' }, { path: 'dataMode', equals: 'demo' },
    ],
  }),
  frontends: choices([['vue-vite', 'Vue and Vite'], ['none', 'No frontend']], ['vue-vite', 'none'], { none: [{ path: 'project.shape', equals: 'api-only' }] }),
  databases: choices([['postgresql', 'PostgreSQL'], ['none', 'No database']], ['postgresql', 'none'], { none: [
    { path: 'project.shape', equals: 'frontend-only' }, { path: 'stack.backend', equals: 'none' }, { path: 'stack.orm', equals: 'none' }, { path: 'dataMode', equals: 'demo' },
  ] }),
  orms: choices([['prisma', 'Prisma'], ['eloquent', 'Eloquent'], ['none', 'No ORM']], ['prisma', 'eloquent', 'none'], {
    eloquent: [
      { path: 'project.blueprint', equals: 'laravel-api' }, { path: 'stack.language', equals: 'php' },
      { path: 'stack.backend', equals: 'laravel' }, { path: 'project.shape', equals: 'api-only' },
      { path: 'project.profile', equals: 'minimal' }, { path: 'repository.layout', equals: 'single-app' },
      { path: 'repository.packageManager', equals: 'composer' }, { path: 'stack.frontend', equals: 'none' },
      { path: 'stack.database', equals: 'postgresql' }, { path: 'company.mode', equals: 'single' },
      { path: 'deploymentProfile', equals: 'local' }, { path: 'dataMode', equals: 'api-backed' },
    ],
    none: [
    { path: 'project.shape', equals: 'frontend-only' }, { path: 'stack.backend', equals: 'none' }, { path: 'stack.database', equals: 'none' }, { path: 'dataMode', equals: 'demo' },
    ],
  }),
  packageManagers: choices([['pnpm', 'pnpm'], ['composer', 'Composer']], ['pnpm', 'composer'], {
    composer: [
      { path: 'project.blueprint', equals: 'laravel-api' }, { path: 'stack.language', equals: 'php' },
      { path: 'stack.backend', equals: 'laravel' }, { path: 'project.shape', equals: 'api-only' },
      { path: 'project.profile', equals: 'minimal' }, { path: 'repository.layout', equals: 'single-app' },
      { path: 'repository.taskRunner', equals: 'none' }, { path: 'stack.frontend', equals: 'none' },
      { path: 'stack.database', equals: 'postgresql' }, { path: 'stack.orm', equals: 'eloquent' },
      { path: 'company.mode', equals: 'single' }, { path: 'deploymentProfile', equals: 'local' },
      { path: 'dataMode', equals: 'api-backed' },
    ],
  }),
  taskRunners: choices([['none', 'None'], ['turborepo', 'Turborepo']], ['none', 'turborepo'], {
    turborepo: [
      { path: 'repository.layout', equals: 'monorepo' }, { path: 'stack.language', equals: 'typescript' },
      { path: 'stack.backend', equals: 'nestjs' },
    ],
  }),
  companyModes: choices([['single', 'Single company'], ['multi', 'Multiple companies']], ['single', 'multi']),
  superAdminScopes: choices([['company', 'Company'], ['global', 'Global']], ['company']),
  auth: booleans(true), authStrategies: choices([['jwt-refresh', 'JWT with refresh tokens'], ['session', 'Session'] ], ['jwt-refresh']),
  rbac: booleans(true, [{ path: 'features.auth', equals: true }]), navigation: choices([['none', 'None'], ['dynamic', 'Dynamic']], ['none', 'dynamic'], { dynamic: [{ path: 'features.rbac', equals: true }, { path: 'features.auth', equals: true }] }),
  audit: booleans(true, [{ path: 'features.auth', equals: true }]),
  redis: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  docker: booleans(true, [{ path: 'repository.layout', equals: 'monorepo' }, { path: 'stack.backend', equals: 'nestjs' }]),
  queue: booleans(true, [{ path: 'features.redis', equals: true }, { path: 'stack.database', equals: 'postgresql' }]),
  realtime: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  apiDocs: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  smtp: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  uploads: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  generatedTests: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  logging: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  ciCd: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  rateLimit: booleans(true, [{ path: 'stack.backend', equals: 'nestjs' }]),
  dataModes: choices([['api-backed', 'API-backed'], ['demo', 'Demo data']], ['api-backed', 'demo'], { demo: [
    { path: 'project.shape', equals: 'frontend-only' }, { path: 'stack.backend', equals: 'none' }, { path: 'stack.database', equals: 'none' }, { path: 'stack.orm', equals: 'none' },
  ] }),
  deploymentProfiles: choices([['local', 'Local'], ['docker', 'Docker'], ['vercel', 'Vercel'], ['vps', 'VPS']], ['local', 'docker', 'vercel', 'vps'], {
    docker: [{ path: 'repository.layout', equals: 'monorepo' }],
    vercel: [{ path: 'project.shape', equals: 'frontend-only' }, { path: 'repository.layout', equals: 'monorepo' }],
    vps: [{ path: 'repository.layout', equals: 'monorepo' }],
  }),
  outputDestinations: choices([['zip', 'Download ZIP'], ['github', 'Push to GitHub']], ['zip', 'github']),
  themes: choices(Object.entries(themePresets).map(([value, preset]) => [value, preset.label]), Object.keys(themePresets)),
  palettes: choices([['blue', 'Blue'], ['emerald', 'Emerald'], ['purple', 'Purple'], ['amber', 'Amber'], ['rose', 'Rose'], ['custom', 'Custom']], ['blue', 'emerald', 'purple', 'amber', 'rose', 'custom']),
  themeModes: choices([['light', 'Light'], ['dark', 'Dark']], ['light', 'dark']),
  themeRadii: choices([['none', 'None'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']], ['none', 'small', 'medium', 'large']),
  themeShadows: choices([['none', 'None'], ['subtle', 'Subtle'], ['medium', 'Medium'], ['strong', 'Strong']], ['none', 'subtle', 'medium', 'strong']),
  themeDensities: choices([['compact', 'Compact'], ['comfortable', 'Comfortable']], ['compact', 'comfortable']),
  optionalFeatures: choices([['redis', 'Redis'], ['docker', 'Docker']]),
};

export function validateCompatibility(config: ProjectConfig): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const unavailable = (path: string, value: unknown) => {
    issues.push({ path, code: path.startsWith('features.') ? 'FEATURE_UNAVAILABLE' : 'TEMPLATE_UNAVAILABLE', message: `${String(value)}: ${later}` });
  };
  const matches = (path: string, value: string, supported: string) => { if (value !== supported) unavailable(path, value); };
  const templatePack = resolveTemplatePack(config);
  if (config.project.blueprint === 'ecommerce' && (config.project.shape !== 'fullstack' || config.repository.layout !== 'monorepo')) {
    issues.push({ path: 'project.blueprint', code: 'FEATURE_DEPENDENCY', message: 'The E-commerce blueprint requires a fullstack monorepo output.' });
  }
  if (config.project.shape === 'fullstack' && config.repository.layout === 'single-app') {
    issues.push({ path: 'repository.layout', code: 'FEATURE_DEPENDENCY', message: 'Single-app layout currently supports API-only and frontend-only projects.' });
  }
  if (config.repository.layout !== 'monorepo' && (config.deploymentProfile !== 'local' || config.features.docker)) {
    issues.push({ path: 'repository.layout', code: 'FEATURE_DEPENDENCY', message: 'Docker, Vercel, and VPS recipes currently require the monorepo layout.' });
  }
  if (templatePack === 'php-laravel') {
    matches('project.blueprint', config.project.blueprint, 'laravel-api');
    matches('project.shape', config.project.shape, 'api-only');
    matches('project.profile', config.project.profile, 'minimal');
    matches('repository.layout', config.repository.layout, 'single-app');
    matches('repository.packageManager', config.repository.packageManager, 'composer');
    matches('repository.taskRunner', config.repository.taskRunner, 'none');
    matches('stack.language', config.stack.language, 'php');
    matches('stack.backend', config.stack.backend, 'laravel');
    matches('stack.frontend', config.stack.frontend, 'none');
    matches('stack.database', config.stack.database, 'postgresql');
    matches('stack.orm', config.stack.orm, 'eloquent');
    matches('company.mode', config.company.mode, 'single');
    matches('company.superAdminScope', config.company.superAdminScope, 'company');
    matches('features.authStrategy', config.features.authStrategy, 'jwt-refresh');
    matches('dataMode', config.dataMode, 'api-backed');
    matches('deploymentProfile', config.deploymentProfile, 'local');
    for (const [feature, value] of Object.entries(config.features)) {
      if (feature === 'authStrategy' || value === false || value === 'none') continue;
      issues.push({ path: `features.${feature}`, code: 'FEATURE_DEPENDENCY', message: `The PHP/Laravel pack does not include ${feature}; use the TypeScript/NestJS pack for that feature.` });
    }
  } else {
  matches('repository.packageManager', config.repository.packageManager, 'pnpm');
  if (config.repository.taskRunner === 'turborepo' && (config.repository.layout !== 'monorepo' || config.stack.backend !== 'nestjs')) {
    issues.push({ path: 'repository.taskRunner', code: 'FEATURE_DEPENDENCY', message: 'Turborepo is supported only for the TypeScript/NestJS monorepo.' });
  }
  matches('stack.language', config.stack.language, 'typescript');
  if (config.project.blueprint === 'laravel-api') {
    issues.push({ path: 'project.blueprint', code: 'FEATURE_DEPENDENCY', message: 'The Laravel API blueprint requires the PHP/Laravel template pack.' });
  }
  if (config.project.shape === 'fullstack') {
    matches('stack.backend', config.stack.backend, 'nestjs');
    matches('stack.frontend', config.stack.frontend, 'vue-vite');
    matches('stack.database', config.stack.database, 'postgresql');
    matches('stack.orm', config.stack.orm, 'prisma');
  } else if (config.project.shape === 'api-only') {
    matches('stack.backend', config.stack.backend, 'nestjs');
    matches('stack.frontend', config.stack.frontend, 'none');
    if (config.stack.database === 'postgresql') matches('stack.orm', config.stack.orm, 'prisma');
    else {
      matches('stack.database', config.stack.database, 'none');
      matches('stack.orm', config.stack.orm, 'none');
      if (config.features.auth || config.project.profile === 'enterprise') {
        issues.push({ path: 'stack.database', code: 'FEATURE_DEPENDENCY', message: 'Authentication requires a persistent database. Select PostgreSQL or disable authentication.' });
      }
    }
  } else {
    matches('stack.backend', config.stack.backend, 'none');
    matches('stack.frontend', config.stack.frontend, 'vue-vite');
    matches('stack.database', config.stack.database, 'none');
    matches('stack.orm', config.stack.orm, 'none');
    matches('dataMode', config.dataMode, 'demo');
    if (config.features.auth || config.features.rbac || config.features.audit || config.features.navigation === 'dynamic' || config.project.profile === 'enterprise' || config.company.mode === 'multi') {
      issues.push({ path: 'project.shape', code: 'FEATURE_DEPENDENCY', message: 'Frontend-only output cannot enforce server-side identity or company isolation.' });
    }
  }
  }
  matches('company.superAdminScope', config.company.superAdminScope, 'company');
  matches('features.authStrategy', config.features.authStrategy, 'jwt-refresh');
  if (config.project.shape !== 'frontend-only') matches('dataMode', config.dataMode, 'api-backed');
  if (config.deploymentProfile === 'vercel' && config.project.shape !== 'frontend-only') {
    issues.push({ path: 'deploymentProfile', code: 'FEATURE_DEPENDENCY', message: 'Vercel deployment currently supports frontend-only static site output.' });
  }
  if (config.features.rbac && !config.features.auth) issues.push({ path: 'features.auth', code: 'FEATURE_DEPENDENCY', message: 'RBAC requires authentication. Enable auth or disable RBAC.' });
  if (config.features.navigation === 'dynamic' && !config.features.rbac) issues.push({ path: 'features.rbac', code: 'FEATURE_DEPENDENCY', message: 'Dynamic navigation requires RBAC. Enable RBAC or disable dynamic navigation.' });
  if (config.features.audit && !config.features.auth) issues.push({ path: 'features.auth', code: 'FEATURE_DEPENDENCY', message: 'User audit events require authentication. Enable auth or disable audit.' });
  if (config.features.queue && !config.features.redis) {
    issues.push({ path: 'features.redis', code: 'FEATURE_DEPENDENCY', message: 'Queue requires the Redis integration. Enable Redis or disable queue.' });
  }
  if (config.features.queue && config.stack.database !== 'postgresql') {
    issues.push({ path: 'stack.database', code: 'FEATURE_DEPENDENCY', message: 'Queue requires the PostgreSQL API stack.' });
  }
  if (config.project.shape === 'frontend-only') {
    for (const feature of ['redis', 'queue', 'realtime', 'apiDocs', 'smtp', 'uploads', 'logging', 'rateLimit'] as const) {
      if (config.features[feature]) issues.push({ path: `features.${feature}`, code: 'FEATURE_DEPENDENCY', message: `${feature} requires a NestJS API.` });
    }
  }
  if (config.project.shape === 'frontend-only' && config.deploymentProfile === 'vps') {
    issues.push({ path: 'deploymentProfile', code: 'FEATURE_DEPENDENCY', message: 'The VPS recipe requires a NestJS API; use Local, Docker, or Vercel for frontend-only output.' });
  }
  if (config.features.generatedTests && config.stack.backend !== 'nestjs') {
    issues.push({ path: 'features.generatedTests', code: 'FEATURE_DEPENDENCY', message: 'Generated backend tests require the NestJS API.' });
  }
  return issues;
}
