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
  {
    name: 'api-only',
    value: {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      stack: { ...config.stack, frontend: 'none' },
    },
  },
  {
    name: 'api-only-no-database',
    value: {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      stack: { ...config.stack, frontend: 'none', database: 'none', orm: 'none' },
    },
  },
  {
    name: 'frontend-only',
    value: {
      ...config,
      project: { ...config.project, shape: 'frontend-only' },
      stack: { ...config.stack, backend: 'none', database: 'none', orm: 'none' },
      dataMode: 'demo',
    },
  },
  {
    name: 'api-single-app',
    value: {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      repository: { ...config.repository, layout: 'single-app' },
      stack: { ...config.stack, frontend: 'none' },
    },
  },
  {
    name: 'frontend-single-app',
    value: {
      ...config,
      project: { ...config.project, shape: 'frontend-only' },
      repository: { ...config.repository, layout: 'single-app' },
      stack: { ...config.stack, backend: 'none', database: 'none', orm: 'none' },
      dataMode: 'demo',
    },
  },
  {
    name: 'ecommerce',
    value: {
      ...config,
      project: { ...config.project, blueprint: 'ecommerce', profile: 'enterprise' },
      features: { ...config.features, auth: true, rbac: true, navigation: 'dynamic', audit: true },
    },
  },
  {
    name: 'all-integrations-docker',
    value: {
      ...config,
      project: { ...config.project, profile: 'enterprise' },
      features: {
        ...config.features,
        auth: true,
        rbac: true,
        navigation: 'dynamic',
        audit: true,
        redis: true,
        docker: true,
        queue: true,
        realtime: true,
        apiDocs: true,
        smtp: true,
        uploads: true,
        generatedTests: true,
        logging: true,
        ciCd: true,
        rateLimit: true,
      },
      deploymentProfile: 'docker',
    },
  },
  {
    name: 'api-only-no-db-docker',
    value: {
      ...config,
      project: { ...config.project, shape: 'api-only' },
      stack: { ...config.stack, frontend: 'none', database: 'none', orm: 'none' },
      features: { ...config.features, docker: true },
      deploymentProfile: 'docker',
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
