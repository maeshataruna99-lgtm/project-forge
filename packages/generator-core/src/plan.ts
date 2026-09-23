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

export function resolveGeneration(input: unknown): { config: ProjectConfig; plan: GenerationPlan; featureFiles: RegisteredFile[] } {
  const config = parseConfig(input);
  const featureFiles = composeFeatureFiles(config);
  const files = [...baseManifest, ...featureFiles.map(file => file.destination)].sort();
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
