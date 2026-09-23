import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';

export function createDefaultConfig(projectName = 'sample-app'): ProjectConfig {
  return projectConfigSchema.parse({
    schemaVersion: 2,
    project: { name: projectName, blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
    repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
    stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
    company: { mode: 'single', superAdminScope: 'company' },
    features: { auth: false, rbac: false, navigation: 'none', audit: false, redis: false, docker: false },
    theme: { preset: 'modern-saas', mode: 'light', primary: '#2563EB', accent: '#F59E0B' },
  });
}
