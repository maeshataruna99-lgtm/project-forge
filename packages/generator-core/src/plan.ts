import { isAbsolute } from 'node:path';
import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';
import { validateCompatibility, type CompatibilityIssue } from '@project-forge/template-registry';
import { composeFeatureFiles, type RegisteredFile } from './compose';

const baseManifest = [
  '.env.example', '.gitignore', 'README.md', 'package.json', 'pnpm-workspace.yaml',
  'packages/config/package.json', 'packages/config/tsconfig.base.json',
  'packages/contracts/package.json', 'packages/contracts/src/index.ts',
  'apps/api/package.json', 'apps/api/tsconfig.json', 'apps/api/src/main.ts',
  'apps/api/src/health.controller.ts', 'apps/api/src/health.controller.test.ts',
  'apps/web/package.json', 'apps/web/index.html', 'apps/web/tsconfig.json',
  'apps/web/vite.config.ts', 'apps/web/src/main.ts', 'apps/web/src/App.vue',
  'apps/web/src/style.css', 'prisma/schema.prisma',
] as const;
const apiManifest = [
  '.env.example', '.gitignore', 'README.md', 'package.json', 'pnpm-workspace.yaml',
  'packages/config/package.json', 'packages/config/tsconfig.base.json',
  'packages/contracts/package.json', 'packages/contracts/src/index.ts',
  'apps/api/package.json', 'apps/api/tsconfig.json', 'apps/api/src/main.ts',
  'apps/api/src/health.controller.ts', 'apps/api/src/health.controller.test.ts',
] as const;
const apiNoDatabaseManifest = apiManifest.filter(path => !path.startsWith('packages/contracts/'));
const frontendManifest = [
  '.gitignore', 'README.md', 'package.json', 'pnpm-workspace.yaml',
  'packages/config/package.json', 'packages/config/tsconfig.base.json',
  'apps/web/package.json', 'apps/web/index.html', 'apps/web/tsconfig.json',
  'apps/web/vite.config.ts', 'apps/web/src/main.ts', 'apps/web/src/App.vue', 'apps/web/src/style.css',
] as const;
const singleApiManifest = [
  '.env.example', '.gitignore', 'README.md', 'package.json', 'tsconfig.base.json',
  'apps/api/tsconfig.json', 'apps/api/src/main.ts', 'apps/api/src/health.controller.ts',
  'apps/api/src/health.controller.test.ts',
] as const;
const singleFrontendManifest = [
  '.gitignore', 'README.md', 'package.json', 'tsconfig.base.json',
  'apps/web/index.html', 'apps/web/tsconfig.json', 'apps/web/vite.config.ts',
  'apps/web/src/main.ts', 'apps/web/src/App.vue', 'apps/web/src/style.css',
] as const;

function baseFilesFor(config: ProjectConfig): RegisteredFile[] {
  const sources = new Map<string, string>();
  let manifest: readonly string[];
  if (config.repository.layout === 'single-app') {
    if (config.project.shape === 'api-only') {
      manifest = singleApiManifest;
      sources.set('package.json', 'layouts/single-app/api-package.json');
      sources.set('tsconfig.base.json', 'layouts/single-app/tsconfig.base.json');
      sources.set('apps/api/tsconfig.json', 'layouts/single-app/api-tsconfig.json');
      sources.set('apps/api/src/health.controller.ts', 'layouts/single-app/api-health.controller.ts');
      if (config.stack.database !== 'postgresql') {
        manifest = singleApiManifest.filter(path => path !== '.env.example');
        sources.set('package.json', 'layouts/single-app/api-no-db-package.json');
      }
      sources.set('README.md', 'shapes/api-only/README.md');
      if (config.stack.database !== 'postgresql') sources.set('README.md', 'shapes/api-only/README-no-db.md');
      if (config.stack.database === 'postgresql') manifest = [...singleApiManifest, 'prisma/schema.prisma'];
    } else {
      manifest = singleFrontendManifest;
      sources.set('package.json', 'layouts/single-app/frontend-package.json');
      sources.set('tsconfig.base.json', 'layouts/single-app/tsconfig.base.json');
      sources.set('apps/web/tsconfig.json', 'layouts/single-app/web-tsconfig.json');
      sources.set('apps/web/vite.config.ts', 'shapes/frontend-only/apps/web/vite.config.ts');
      sources.set('apps/web/src/App.vue', 'shapes/frontend-only/apps/web/src/App.vue');
      sources.set('README.md', 'shapes/frontend-only/README.md');
    }
  } else if (config.project.shape === 'api-only') {
    manifest = config.stack.database === 'postgresql' ? apiManifest : apiNoDatabaseManifest;
    if (config.stack.database === 'postgresql') manifest = [...apiManifest, 'prisma/schema.prisma'];
    else {
      manifest = apiNoDatabaseManifest.filter(path => path !== '.env.example');
      sources.set('apps/api/package.json', 'shapes/api-only/api-package-no-db.json');
      sources.set('apps/api/src/health.controller.ts', 'layouts/single-app/api-health.controller.ts');
    }
    sources.set('package.json', config.stack.database === 'postgresql' ? 'shapes/api-only/package.json' : 'shapes/api-only/package-no-db.json');
    sources.set('pnpm-workspace.yaml', 'shapes/api-only/pnpm-workspace.yaml');
    sources.set('README.md', 'shapes/api-only/README.md');
    if (config.stack.database !== 'postgresql') sources.set('README.md', 'shapes/api-only/README-no-db.md');
  } else if (config.project.shape === 'frontend-only') {
    manifest = frontendManifest;
    sources.set('package.json', 'shapes/frontend-only/package.json');
    sources.set('pnpm-workspace.yaml', 'shapes/frontend-only/pnpm-workspace.yaml');
    sources.set('apps/web/package.json', 'shapes/frontend-only/apps/web/package.json');
    sources.set('apps/web/vite.config.ts', 'shapes/frontend-only/apps/web/vite.config.ts');
    sources.set('apps/web/src/App.vue', 'shapes/frontend-only/apps/web/src/App.vue');
    sources.set('README.md', 'shapes/frontend-only/README.md');
  } else {
    manifest = baseManifest;
    if (config.project.blueprint === 'ecommerce') {
      sources.set('apps/web/src/App.vue', 'blueprints/ecommerce/apps/web/src/App.vue');
    }
  }
  return manifest.map(destination => ({ source: sources.get(destination) ?? destination, destination }));
}

export type GenerationPlan = {
  templatePack: 'typescript-nest-vue';
  projectName: string;
  profile: 'minimal' | 'enterprise';
  blueprint: ProjectConfig['project']['blueprint'];
  shape: ProjectConfig['project']['shape'];
  layout: ProjectConfig['repository']['layout'];
  capabilities: string[];
  features: ProjectConfig['features'];
  stack: ProjectConfig['stack'];
  company: ProjectConfig['company'];
  dataMode: ProjectConfig['dataMode'];
  deploymentProfile: ProjectConfig['deploymentProfile'];
  outputDestination: ProjectConfig['output']['destination'];
  files: string[];
  theme: { preset: ProjectConfig['theme']['preset']; palette: ProjectConfig['theme']['palette']; mode: 'light' | 'dark'; primary: string; accent: string; radius: ProjectConfig['theme']['radius']; shadow: ProjectConfig['theme']['shadow']; density: ProjectConfig['theme']['density'] };
};

export class ConfigurationError extends Error {
  constructor(public readonly issues: CompatibilityIssue[]) {
    super('Invalid or unsupported project configuration');
    this.name = 'ConfigurationError';
  }
}

export class GenerationError extends Error {
  constructor() {
    super('Project generation failed');
    this.name = 'GenerationError';
  }
}

export function assertSafeArchivePath(path: string): void {
  if (!path || isAbsolute(path) || path.startsWith('/') || path.includes('\\') || path.includes(':')) throw new GenerationError();
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || segment === '.env' || (segment.startsWith('.env.') && segment !== '.env.example'))) {
    throw new GenerationError();
  }
}

function parseConfig(input: unknown): ProjectConfig {
  const parsed = projectConfigSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConfigurationError(parsed.error.issues.map(issue => ({
      path: issue.path.join('.'), code: 'INVALID_INPUT', message: issue.message,
    })));
  }
  const issues = validateCompatibility(parsed.data);
  if (issues.length) throw new ConfigurationError(issues);
  return parsed.data;
}

export function resolveGeneration(input: unknown): { config: ProjectConfig; plan: GenerationPlan; baseFiles: RegisteredFile[]; featureFiles: RegisteredFile[] } {
  const config = parseConfig(input);
  const baseFiles = baseFilesFor(config);
  const featureFiles = composeFeatureFiles(config);
  const files = [...baseFiles.map(file => file.destination), ...featureFiles.map(file => file.destination)].sort();
  const seen = new Set<string>();
  for (const path of files) {
    assertSafeArchivePath(path);
    const key = path.toLowerCase();
    if (seen.has(key)) throw new GenerationError();
    seen.add(key);
  }
  for (const file of featureFiles) assertSafeArchivePath(file.source);
  const capabilities = [
    ...(config.features.auth || config.project.profile === 'enterprise' ? ['auth', 'company-scope'] : []),
    ...(config.features.rbac ? ['rbac'] : []),
    ...(config.features.navigation === 'dynamic' ? ['dynamic-navigation'] : []),
    ...(config.features.audit ? ['audit'] : []),
  ];
  return {
    config,
    baseFiles,
    featureFiles,
    plan: {
      templatePack: 'typescript-nest-vue',
      projectName: config.project.name,
      profile: config.project.profile,
      blueprint: config.project.blueprint,
      shape: config.project.shape,
      layout: config.repository.layout,
      capabilities,
      features: { ...config.features, auth: config.features.auth || config.project.profile === 'enterprise' },
      stack: { ...config.stack },
      company: { ...config.company },
      dataMode: config.dataMode,
      deploymentProfile: config.deploymentProfile,
      outputDestination: config.output.destination,
      files,
      theme: { ...config.theme },
    },
  };
}

export function createPlan(input: unknown): GenerationPlan {
  return resolveGeneration(input).plan;
}
