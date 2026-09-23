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

export function composeFeatureFiles(config: ProjectConfig): RegisteredFile[] {
  const files: RegisteredFile[] = [];
  if ((config.features.auth || config.project.profile === 'enterprise') && config.project.shape !== 'frontend-only') {
    files.push(...authFiles.filter(file => config.project.shape !== 'api-only' || !file.destination.startsWith('apps/web/')));
  }
  if (config.features.rbac) files.push(...rbacFiles);
  if (config.features.navigation === 'dynamic') files.push(...navigationFiles);
  if (config.features.audit) files.push(...auditFiles);
  return files;
}
