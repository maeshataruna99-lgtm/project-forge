import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';

export function createDefaultConfig(projectName = 'sample-app'): ProjectConfig {
  return projectConfigSchema.parse({
    schemaVersion: 3,
    project: { name: projectName, blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
    repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
    stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
    company: { mode: 'single', superAdminScope: 'company' },
    features: {
      auth: false, authStrategy: 'jwt-refresh', rbac: false, navigation: 'none', audit: false,
      redis: false, docker: false, queue: false, realtime: false, apiDocs: false, smtp: false,
      uploads: false, generatedTests: false, logging: false, ciCd: false, rateLimit: false,
    },
    dataMode: 'api-backed',
    deploymentProfile: 'local',
    output: { destination: 'zip' },
    theme: {
      preset: 'modern-saas', palette: 'blue', mode: 'light', primary: '#2563EB', accent: '#F59E0B',
      radius: 'medium', shadow: 'subtle', density: 'comfortable',
    },
  });
}
