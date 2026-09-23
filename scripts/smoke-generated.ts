import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { unzipSync } from 'fflate';
import { createArchive } from '../packages/generator-core/src/index';

const config = JSON.parse(readFileSync(join(import.meta.dirname, '../examples/minimal-config.json'), 'utf8')) as {
  project: { name: string; profile: string };
  features: { auth: boolean };
};
const output = mkdtempSync(join(tmpdir(), 'project-forge-smoke-'));
const configs = [
  { name: 'minimal', value: config },
  {
    name: 'enterprise-auth',
    value: {
      ...config,
      project: { ...config.project, profile: 'enterprise' },
      features: { ...config.features, auth: true },
    },
  },
  {
    name: 'enterprise-access-control',
    value: {
      ...config,
      project: { ...config.project, profile: 'enterprise' },
      features: { ...config.features, auth: true, rbac: true, navigation: 'dynamic', audit: true },
    },
  },
];
for (const selected of configs) {
  const files = unzipSync(createArchive(selected.value));
  for (const [path, content] of Object.entries(files)) {
    const target = join(output, selected.name, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}
process.stdout.write(output);
