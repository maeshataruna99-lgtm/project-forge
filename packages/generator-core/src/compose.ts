import type { ProjectConfig } from '@project-forge/contracts';

export type RegisteredFile = { source: string; destination: string };

const authFiles: RegisteredFile[] = [
  { source: 'fragments/auth/StarterAuth.vue', destination: 'apps/web/src/components/StarterAuth.vue' },
  { source: 'fragments/auth/auth.service.ts', destination: 'apps/api/src/auth/auth.service.ts' },
  { source: 'fragments/auth/auth.controller.test.ts', destination: 'apps/api/src/auth/auth.controller.test.ts' },
  { source: 'fragments/auth/auth.guard.test.ts', destination: 'apps/api/src/auth/auth.guard.test.ts' },
  { source: 'fragments/auth/auth-rate-limit.guard.test.ts', destination: 'apps/api/src/auth/auth-rate-limit.guard.test.ts' },
  { source: 'fragments/auth/auth.controller.ts', destination: 'apps/api/src/auth/auth.controller.ts' },
  { source: 'fragments/auth/auth.guard.ts', destination: 'apps/api/src/auth/auth.guard.ts' },
  { source: 'fragments/auth/auth-rate-limit.guard.ts', destination: 'apps/api/src/auth/auth-rate-limit.guard.ts' },
  { source: 'fragments/auth/auth.module.ts', destination: 'apps/api/src/auth/auth.module.ts' },
  { source: 'fragments/company/company.service.ts', destination: 'apps/api/src/company/company.service.ts' },
  { source: 'fragments/company/scope.ts', destination: 'apps/api/src/company/scope.ts' },
  { source: 'fragments/company/scope.test.ts', destination: 'apps/api/src/company/scope.test.ts' },
];
const rbacFiles: RegisteredFile[] = [
  { source: 'fragments/rbac/permissions.ts', destination: 'apps/api/src/rbac/permissions.ts' },
  { source: 'fragments/rbac/permission.guard.ts', destination: 'apps/api/src/rbac/permission.guard.ts' },
  { source: 'fragments/rbac/permission.guard.test.ts', destination: 'apps/api/src/rbac/permission.guard.test.ts' },
  { source: 'fragments/rbac/permissions.test.ts', destination: 'apps/api/src/rbac/permissions.test.ts' },
  { source: 'fragments/rbac/projects.controller.ts', destination: 'apps/api/src/rbac/projects.controller.ts' },
  { source: 'fragments/rbac/rbac.module.ts', destination: 'apps/api/src/rbac/rbac.module.ts' },
  { source: 'fragments/rbac/seed-access-control.mjs', destination: 'apps/api/src/rbac/seed-access-control.mjs' },
  { source: 'fragments/rbac/seed-access-control.d.ts', destination: 'apps/api/src/rbac/seed-access-control.d.ts' },
  { source: 'fragments/rbac/seed-access-control.test.ts', destination: 'apps/api/src/rbac/seed-access-control.test.ts' },
  { source: 'fragments/rbac/seed.mjs', destination: 'prisma/seed.mjs' },
];
const navigationFiles: RegisteredFile[] = [
  { source: 'fragments/navigation/navigation.service.ts', destination: 'apps/api/src/navigation/navigation.service.ts' },
  { source: 'fragments/navigation/navigation.service.test.ts', destination: 'apps/api/src/navigation/navigation.service.test.ts' },
  { source: 'fragments/navigation/navigation.controller.ts', destination: 'apps/api/src/navigation/navigation.controller.ts' },
  { source: 'fragments/navigation/navigation.module.ts', destination: 'apps/api/src/navigation/navigation.module.ts' },
];
const auditFiles: RegisteredFile[] = [
  { source: 'fragments/audit/audit.service.ts', destination: 'apps/api/src/audit/audit.service.ts' },
  { source: 'fragments/audit/audit.service.test.ts', destination: 'apps/api/src/audit/audit.service.test.ts' },
  { source: 'fragments/audit/audit.interceptor.ts', destination: 'apps/api/src/audit/audit.interceptor.ts' },
  { source: 'fragments/audit/audit.controller.ts', destination: 'apps/api/src/audit/audit.controller.ts' },
  { source: 'fragments/audit/audit.module.ts', destination: 'apps/api/src/audit/audit.module.ts' },
];
const ecommerceFiles: RegisteredFile[] = [
  { source: 'blueprints/ecommerce/apps/api/src/products/product.ts', destination: 'apps/api/src/products/product.ts' },
  { source: 'blueprints/ecommerce/apps/api/src/products/products.service.ts', destination: 'apps/api/src/products/products.service.ts' },
  { source: 'blueprints/ecommerce/apps/api/src/products/products.controller.ts', destination: 'apps/api/src/products/products.controller.ts' },
  { source: 'blueprints/ecommerce/apps/api/src/products/products.module.ts', destination: 'apps/api/src/products/products.module.ts' },
  { source: 'blueprints/ecommerce/apps/api/src/products/products.controller.test.ts', destination: 'apps/api/src/products/products.controller.test.ts' },
];
const redisFiles: RegisteredFile[] = [
  { source: 'fragments/redis/redis.service.ts', destination: 'apps/api/src/redis/redis.service.ts' },
  { source: 'fragments/redis/redis.module.ts', destination: 'apps/api/src/redis/redis.module.ts' },
  { source: 'fragments/redis/redis.service.test.ts', destination: 'apps/api/src/redis/redis.service.test.ts' },
];
const queueFiles: RegisteredFile[] = [
  { source: 'fragments/queue/queue.service.ts', destination: 'apps/api/src/queue/queue.service.ts' },
  { source: 'fragments/queue/queue.controller.ts', destination: 'apps/api/src/queue/queue.controller.ts' },
  { source: 'fragments/queue/queue.module.ts', destination: 'apps/api/src/queue/queue.module.ts' },
  { source: 'fragments/queue/queue.service.test.ts', destination: 'apps/api/src/queue/queue.service.test.ts' },
];
const realtimeFiles: RegisteredFile[] = [
  { source: 'fragments/realtime/realtime.gateway.ts', destination: 'apps/api/src/realtime/realtime.gateway.ts' },
  { source: 'fragments/realtime/realtime.module.ts', destination: 'apps/api/src/realtime/realtime.module.ts' },
];
const apiDocsFiles: RegisteredFile[] = [{ source: 'fragments/api-docs/setup.ts', destination: 'apps/api/src/api-docs/setup.ts' }];
const smtpFiles: RegisteredFile[] = [
  { source: 'fragments/email/email.service.ts', destination: 'apps/api/src/email/email.service.ts' },
  { source: 'fragments/email/email.module.ts', destination: 'apps/api/src/email/email.module.ts' },
  { source: 'fragments/email/nodemailer.d.ts', destination: 'apps/api/src/email/nodemailer.d.ts' },
];
const uploadFiles: RegisteredFile[] = [
  { source: 'fragments/uploads/uploads.controller.ts', destination: 'apps/api/src/uploads/uploads.controller.ts' },
  { source: 'fragments/uploads/uploads.module.ts', destination: 'apps/api/src/uploads/uploads.module.ts' },
];
const loggingFiles: RegisteredFile[] = [
  { source: 'fragments/logging/structured-logger.ts', destination: 'apps/api/src/logging/structured-logger.ts' },
  { source: 'fragments/logging/structured-logger.test.ts', destination: 'apps/api/src/logging/structured-logger.test.ts' },
];
const rateLimitFiles: RegisteredFile[] = [
  { source: 'fragments/rate-limit/api-rate-limit.guard.ts', destination: 'apps/api/src/rate-limit/api-rate-limit.guard.ts' },
  { source: 'fragments/rate-limit/api-rate-limit.guard.test.ts', destination: 'apps/api/src/rate-limit/api-rate-limit.guard.test.ts' },
];

export function composeFeatureFiles(config: ProjectConfig): RegisteredFile[] {
  const files: RegisteredFile[] = [];
  if ((config.features.auth || config.project.profile === 'enterprise') && config.project.shape !== 'frontend-only') {
    files.push(...authFiles.filter(file => config.project.shape !== 'api-only' || !file.destination.startsWith('apps/web/')));
  }
  if (config.features.rbac) files.push(...rbacFiles);
  if (config.features.navigation === 'dynamic') files.push(...navigationFiles);
  if (config.features.audit) files.push(...auditFiles);
  if (config.features.redis) files.push(...redisFiles);
  if (config.features.queue) files.push(...queueFiles);
  if (config.features.realtime) files.push(...realtimeFiles);
  if (config.features.apiDocs) files.push(...apiDocsFiles);
  if (config.features.smtp) files.push(...smtpFiles);
  if (config.features.uploads) files.push(...uploadFiles);
  if (config.features.logging) files.push(...loggingFiles);
  if (config.features.rateLimit) files.push(...rateLimitFiles);
  if (config.features.generatedTests) files.push({ source: 'fragments/generated-tests/generated-feature.test.ts', destination: 'apps/api/src/generated-feature.test.ts' });
  if (config.features.ciCd) files.push({
    source: config.project.shape === 'frontend-only' ? 'fragments/ci-cd/verify-web.yml' : 'fragments/ci-cd/verify.yml',
    destination: '.github/workflows/verify-generated.yml',
  });
  if (config.project.blueprint === 'ecommerce') {
    files.push(...ecommerceFiles.map(file => config.features.rbac && file.destination.endsWith('products.controller.ts')
      ? { ...file, source: 'blueprints/ecommerce/apps/api/src/products/products.controller.secured.ts' }
      : file));
    files.push({ source: 'blueprints/ecommerce/fragments/permissions.ts', destination: 'apps/api/src/products/permissions.ts' });
  }
  return files;
}
