import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { strToU8, zipSync } from 'fflate';
import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';
import { validateCompatibility, type CompatibilityIssue } from '@project-forge/template-registry';

const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../templates/typescript-nest-vue');
const MAX_ARCHIVE_BYTES = 2_000_000;
const MAX_SOURCE_BYTES = 2_000_000;
const MAX_GENERATION_MS = 5_000;

const manifest = [
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
  projectName: string;
  profile: 'minimal';
  files: string[];
  theme: { mode: 'light' | 'dark'; primary: string; accent: string };
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

function validate(input: unknown): ProjectConfig {
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

export function createPlan(input: unknown): GenerationPlan {
  const config = validate(input);
  const seen = new Set<string>();
  for (const path of manifest) {
    assertSafeArchivePath(path);
    const key = path.toLowerCase();
    if (seen.has(key)) throw new GenerationError();
    seen.add(key);
  }
  return {
    projectName: config.project.name,
    profile: 'minimal',
    files: [...manifest],
    theme: { mode: config.theme.mode, primary: config.theme.primary, accent: config.theme.accent },
  };
}

function readTemplate(path: string): string {
  try {
    const root = realpathSync(templateRoot);
    const requested = resolve(root, path);
    const actual = realpathSync(requested);
    const inside = relative(root, actual);
    if (!inside || inside.startsWith('..' + sep) || inside === '..' || isAbsolute(inside) || !lstatSync(requested).isFile()) throw new GenerationError();
    return readFileSync(actual, 'utf8');
  } catch {
    throw new GenerationError();
  }
}

function render(source: string, config: ProjectConfig): string {
  return source
    .replaceAll('__PROJECT_NAME__', config.project.name)
    .replaceAll('__PRIMARY_COLOR__', config.theme.primary)
    .replaceAll('__ACCENT_COLOR__', config.theme.accent)
    .replaceAll('__THEME_MODE__', config.theme.mode);
}

function prepareFiles(input: unknown): Record<string, Uint8Array> {
  const config = validate(input);
  const plan = createPlan(config);
  const files: Record<string, Uint8Array> = {};
  let totalBytes = 0;
  for (const path of plan.files) {
    const content = strToU8(render(readTemplate(path), config));
    totalBytes += content.length;
    if (totalBytes > MAX_SOURCE_BYTES) throw new GenerationError();
    const archivePath = `${plan.projectName}/${path}`;
    assertSafeArchivePath(archivePath);
    files[archivePath] = content;
  }
  return files;
}

export function createArchive(input: unknown): Uint8Array {
  const archive = zipSync(prepareFiles(input), { level: 6 });
  if (archive.length > MAX_ARCHIVE_BYTES) throw new GenerationError();
  return archive;
}

export function createArchiveAsync(input: unknown): Promise<Uint8Array> {
  const files = prepareFiles(input);
  return new Promise((resolveArchive, rejectArchive) => {
    const worker = new Worker(resolve(dirname(fileURLToPath(import.meta.url)), 'zip-worker.cjs'));
    let settled = false;
    const finish = (archive?: Uint8Array) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();
      if (!archive || archive.length > MAX_ARCHIVE_BYTES) rejectArchive(new GenerationError());
      else resolveArchive(archive);
    };
    const timeout = setTimeout(() => finish(), MAX_GENERATION_MS);
    worker.once('message', (message: { archive?: Uint8Array }) => finish(message.archive));
    worker.once('error', () => finish());
    worker.once('exit', code => {
      if (code !== 0) finish();
    });
    worker.postMessage(files);
  });
}
