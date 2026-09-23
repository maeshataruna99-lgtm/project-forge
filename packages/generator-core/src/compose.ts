import type { ProjectConfig } from '@project-forge/contracts';

export type RegisteredFile = { source: string; destination: string };

const authFiles: RegisteredFile[] = [
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

export function composeFeatureFiles(config: ProjectConfig): RegisteredFile[] {
  const files: RegisteredFile[] = [];
  if (config.features.auth || config.project.profile === 'enterprise') files.push(...authFiles);
  return files;
}
