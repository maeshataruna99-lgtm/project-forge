import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { unzipSync } from 'fflate';
import { createArchive } from '../packages/generator-core/src/index';

const config = JSON.parse(readFileSync(join(import.meta.dirname, '../examples/minimal-config.json'), 'utf8')) as unknown;
const output = mkdtempSync(join(tmpdir(), 'project-forge-smoke-'));
const files = unzipSync(createArchive(config));
for (const [path, content] of Object.entries(files)) {
  const target = join(output, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
process.stdout.write(join(output, 'sample-app'));
