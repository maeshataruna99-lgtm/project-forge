import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { catalogSchema } from '@project-forge/contracts';
import { createApp } from './app';

const config = {
  schemaVersion: 4,
  project: { name: 'sample-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false, redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false, uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false },
  dataMode: 'api-backed', deploymentProfile: 'local', output: { destination: 'zip' },
  ui: { layout: 'single-column' },
  theme: { preset: 'modern-saas', palette: 'blue', mode: 'light', primary: '#2563EB', accent: '#F59E0B', radius: 'medium', shadow: 'subtle', density: 'comfortable' },
};

describe('generation API', () => {
  let app: INestApplication;
  beforeEach(async () => { app = await createApp(); });
  afterEach(async () => { await app.close(); });

  it('returns health and catalog', async () => {
    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body).toEqual({ status: 'ok' });
    const catalog = await request(app.getHttpServer()).get('/generator/catalog').expect(200);
    expect(catalog.body.profiles).toEqual(expect.arrayContaining([expect.objectContaining({ value: 'minimal', available: true })]));
    expect(catalogSchema.safeParse(catalog.body).success).toBe(true);
    expect(catalog.body.auth).toEqual(expect.arrayContaining([expect.objectContaining({ value: 'false', available: true })]));
  });

  it('validates and returns a representative file tree', async () => {
    const result = await request(app.getHttpServer()).post('/generator/validate').send(config).expect(201);
    expect(result.body.files).toContain('apps/web/src/App.vue');
    expect(result.body.projectName).toBe('sample-app');
  });

  it('validates the Enterprise auth path and exposes its registered files', async () => {
    const enterprise = {
      ...config,
      project: { ...config.project, profile: 'enterprise' },
      features: { ...config.features, auth: true, rbac: true, navigation: 'dynamic', audit: true },
    };
    const result = await request(app.getHttpServer()).post('/generator/validate').send(enterprise).expect(201);
    expect(result.body.capabilities).toEqual(['auth', 'company-scope', 'rbac', 'dynamic-navigation', 'audit']);
    expect(result.body.files).toContain('apps/api/src/auth/auth.controller.ts');
    expect(result.body.files).toContain('apps/api/src/company/company.service.ts');
    expect(result.body.files).toContain('apps/api/src/rbac/permission.guard.ts');
    expect(result.body.files).toContain('apps/api/src/navigation/navigation.controller.ts');
    expect(result.body.files).toContain('apps/api/src/audit/audit.interceptor.ts');
  });

  it('reports field issues and a correlation ID for unsupported choices', async () => {
    const result = await request(app.getHttpServer()).post('/generator/validate').send({ ...config, features: { ...config.features, audit: true } }).expect(400);
    expect(result.body.code).toBe('INVALID_CONFIGURATION');
    expect(result.body.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.body.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'features.auth', code: 'FEATURE_DEPENDENCY' })]));
  });

  it('returns a ZIP with a safe filename', async () => {
    const result = await request(app.getHttpServer()).post('/generator/archive').send(config).buffer(true).parse((response, done) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => done(null, Buffer.concat(chunks)));
    }).expect(201);
    expect(result.headers['content-type']).toMatch(/application\/zip/);
    expect(result.headers['content-disposition']).toContain('sample-app.zip');
    expect(result.body.subarray(0, 2).toString()).toBe('PK');
  });

  it('requires valid GitHub destination details and an opaque authorization session', async () => {
    const result = await request(app.getHttpServer()).post('/generator/github').send({ confirmed: true }).expect(400);
    expect(result.body.code).toBe('INVALID_GITHUB_OUTPUT_REQUEST');
    expect(JSON.stringify(result.body)).not.toMatch(/token|device_code/i);
  });

  it('does not perform a repository operation when the user cancels', async () => {
    const result = await request(app.getHttpServer()).post('/generator/github').send({
      confirmed: false,
      authorizationId: '00000000-0000-4000-8000-000000000001',
      owner: 'cinder',
      name: 'sample-app',
      visibility: 'public',
      config: { ...config, output: { destination: 'github' } },
    }).expect(201);
    expect(result.body).toEqual({ status: 'cancelled' });
  });

  it('returns a safe configuration response when GitHub device authorization is not configured', async () => {
    const result = await request(app.getHttpServer()).post('/generator/github/device').expect(503);
    expect(result.body.code).toBe('GITHUB_NOT_CONFIGURED');
    expect(JSON.stringify(result.body)).not.toMatch(/client_id|device_code|token/i);
  });

  it('rejects oversized JSON requests', async () => {
    const result = await request(app.getHttpServer()).post('/generator/validate').send({ padding: 'x'.repeat(20_000) }).expect(413);
    expect(result.body.code).toBe('REQUEST_TOO_LARGE');
  });

  it('returns a structured error for malformed JSON', async () => {
    const result = await request(app.getHttpServer()).post('/generator/validate').set('Content-Type', 'application/json').send('{').expect(400);
    expect(result.body.code).toBe('INVALID_JSON');
    expect(result.body.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects unknown nested configuration fields', async () => {
    const input = { ...config, project: { ...config.project, unexpected: true } };
    const result = await request(app.getHttpServer()).post('/generator/validate').send(input).expect(400);
    expect(result.body.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'project' })]));
  });

  it('returns busy for saturated concurrent archive requests', async () => {
    const responses = await Promise.all(Array.from({ length: 8 }, () => request(app.getHttpServer()).post('/generator/archive').send(config)));
    expect(responses.some(result => result.status === 201)).toBe(true);
    expect(responses.some(result => result.status === 429 && result.body.code === 'GENERATOR_BUSY'), JSON.stringify(responses.map(result => [result.status, result.body.code]))).toBe(true);
    expect(responses.every(result => result.status === 201 || result.status === 429)).toBe(true);
  });
});
