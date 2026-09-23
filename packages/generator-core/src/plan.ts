import { isAbsolute } from "node:path";
import {
  projectConfigSchema,
  type ProjectConfig,
} from "@project-forge/contracts";
import {
  resolveTemplatePack,
  validateCompatibility,
  type CompatibilityIssue,
  type TemplatePackId,
} from "@project-forge/template-registry";
import { composeFeatureFiles, type RegisteredFile } from "./compose";

const baseManifest = [
  ".env.example",
  ".gitignore",
  "README.md",
  "package.json",
  "pnpm-workspace.yaml",
  "packages/config/package.json",
  "packages/config/tsconfig.base.json",
  "packages/contracts/package.json",
  "packages/contracts/src/index.ts",
  "apps/api/package.json",
  "apps/api/tsconfig.json",
  "apps/api/src/main.ts",
  "apps/api/src/health.controller.ts",
  "apps/api/src/health.controller.test.ts",
  "apps/web/package.json",
  "apps/web/index.html",
  "apps/web/tsconfig.json",
  "apps/web/vite.config.ts",
  "apps/web/src/main.ts",
  "apps/web/src/App.vue",
  "apps/web/src/components/StarterLayout.vue",
  "apps/web/src/style.css",
  "prisma/schema.prisma",
] as const;
const apiManifest = [
  ".env.example",
  ".gitignore",
  "README.md",
  "package.json",
  "pnpm-workspace.yaml",
  "packages/config/package.json",
  "packages/config/tsconfig.base.json",
  "packages/contracts/package.json",
  "packages/contracts/src/index.ts",
  "apps/api/package.json",
  "apps/api/tsconfig.json",
  "apps/api/src/main.ts",
  "apps/api/src/health.controller.ts",
  "apps/api/src/health.controller.test.ts",
] as const;
const apiNoDatabaseManifest = apiManifest.filter(
  (path) => !path.startsWith("packages/contracts/"),
);
const frontendManifest = [
  ".gitignore",
  "README.md",
  "package.json",
  "pnpm-workspace.yaml",
  "packages/config/package.json",
  "packages/config/tsconfig.base.json",
  "apps/web/package.json",
  "apps/web/index.html",
  "apps/web/tsconfig.json",
  "apps/web/vite.config.ts",
  "apps/web/src/main.ts",
  "apps/web/src/App.vue",
  "apps/web/src/style.css",
  "apps/web/src/components/StarterLayout.vue",
] as const;
const singleApiManifest = [
  ".env.example",
  ".gitignore",
  "README.md",
  "package.json",
  "tsconfig.base.json",
  "apps/api/tsconfig.json",
  "apps/api/src/main.ts",
  "apps/api/src/health.controller.ts",
  "apps/api/src/health.controller.test.ts",
] as const;
const singleFrontendManifest = [
  ".gitignore",
  "README.md",
  "package.json",
  "tsconfig.base.json",
  "apps/web/index.html",
  "apps/web/tsconfig.json",
  "apps/web/vite.config.ts",
  "apps/web/src/main.ts",
  "apps/web/src/App.vue",
  "apps/web/src/style.css",
  "apps/web/src/components/StarterLayout.vue",
] as const;
const laravelApiManifest = [
  ".github/workflows/verify-laravel.yml",
  ".editorconfig",
  ".env.example",
  ".gitattributes",
  ".gitignore",
  "README.md",
  "artisan",
  "composer.json",
  "phpunit.xml",
  "app/Http/Controllers/Api/HealthController.php",
  "app/Http/Controllers/Api/ProjectController.php",
  "app/Models/Project.php",
  "app/Models/User.php",
  "app/Providers/AppServiceProvider.php",
  "bootstrap/app.php",
  "bootstrap/cache/.gitignore",
  "bootstrap/providers.php",
  "config/app.php",
  "config/auth.php",
  "config/cache.php",
  "config/database.php",
  "config/filesystems.php",
  "config/logging.php",
  "config/mail.php",
  "config/queue.php",
  "config/services.php",
  "config/session.php",
  "database/factories/UserFactory.php",
  "database/migrations/0001_01_01_000000_create_users_table.php",
  "database/migrations/0001_01_01_000001_create_cache_table.php",
  "database/migrations/0001_01_01_000002_create_jobs_table.php",
  "database/migrations/2026_01_01_000000_create_projects_table.php",
  "database/seeders/DatabaseSeeder.php",
  "public/.htaccess",
  "public/index.php",
  "routes/api.php",
  "routes/console.php",
  "storage/app/private/.gitignore",
  "storage/app/public/.gitignore",
  "storage/framework/cache/data/.gitignore",
  "storage/framework/sessions/.gitignore",
  "storage/framework/testing/.gitignore",
  "storage/framework/views/.gitignore",
  "storage/logs/.gitignore",
  "tests/Feature/HealthTest.php",
  "tests/TestCase.php",
] as const;

function baseFilesFor(config: ProjectConfig): RegisteredFile[] {
  if (resolveTemplatePack(config) === "php-laravel") {
    return laravelApiManifest.map((path) => ({
      source: path,
      destination: path,
    }));
  }
  const sources = new Map<string, string>();
  let manifest: readonly string[];
  if (config.repository.layout === "single-app") {
    if (config.project.shape === "api-only") {
      manifest = singleApiManifest;
      sources.set("package.json", "layouts/single-app/api-package.json");
      sources.set(
        "tsconfig.base.json",
        "layouts/single-app/tsconfig.base.json",
      );
      sources.set(
        "apps/api/tsconfig.json",
        "layouts/single-app/api-tsconfig.json",
      );
      sources.set(
        "apps/api/src/health.controller.ts",
        "layouts/single-app/api-health.controller.ts",
      );
      if (config.stack.database !== "postgresql") {
        if (
          !config.features.redis &&
          !config.features.smtp &&
          !config.features.docker &&
          config.deploymentProfile !== "docker"
        ) {
          manifest = singleApiManifest.filter(
            (path) => path !== ".env.example",
          );
        }
        sources.set(
          "package.json",
          "layouts/single-app/api-no-db-package.json",
        );
      }
      sources.set("README.md", "shapes/api-only/README.md");
      if (config.stack.database !== "postgresql")
        sources.set("README.md", "shapes/api-only/README-no-db.md");
      if (config.stack.database === "postgresql")
        manifest = [...singleApiManifest, "prisma/schema.prisma"];
    } else {
      manifest = singleFrontendManifest;
      sources.set("package.json", "layouts/single-app/frontend-package.json");
      sources.set(
        "tsconfig.base.json",
        "layouts/single-app/tsconfig.base.json",
      );
      sources.set(
        "apps/web/tsconfig.json",
        "layouts/single-app/web-tsconfig.json",
      );
      sources.set(
        "apps/web/vite.config.ts",
        "shapes/frontend-only/apps/web/vite.config.ts",
      );
      sources.set(
        "apps/web/src/App.vue",
        "shapes/frontend-only/apps/web/src/App.vue",
      );
      sources.set("README.md", "shapes/frontend-only/README.md");
    }
  } else if (config.project.shape === "api-only") {
    manifest =
      config.stack.database === "postgresql"
        ? apiManifest
        : apiNoDatabaseManifest;
    if (config.stack.database === "postgresql")
      manifest = [...apiManifest, "prisma/schema.prisma"];
    else {
      if (
        !config.features.redis &&
        !config.features.smtp &&
        !config.features.docker &&
        config.deploymentProfile !== "docker"
      ) {
        manifest = apiNoDatabaseManifest.filter(
          (path) => path !== ".env.example",
        );
      }
      sources.set(
        "apps/api/package.json",
        "shapes/api-only/api-package-no-db.json",
      );
      sources.set(
        "apps/api/src/health.controller.ts",
        "layouts/single-app/api-health.controller.ts",
      );
    }
    sources.set(
      "package.json",
      config.stack.database === "postgresql"
        ? "shapes/api-only/package.json"
        : "shapes/api-only/package-no-db.json",
    );
    sources.set("pnpm-workspace.yaml", "shapes/api-only/pnpm-workspace.yaml");
    sources.set("README.md", "shapes/api-only/README.md");
    if (config.stack.database !== "postgresql")
      sources.set("README.md", "shapes/api-only/README-no-db.md");
  } else if (config.project.shape === "frontend-only") {
    manifest = frontendManifest;
    sources.set("package.json", "shapes/frontend-only/package.json");
    sources.set(
      "pnpm-workspace.yaml",
      "shapes/frontend-only/pnpm-workspace.yaml",
    );
    sources.set(
      "apps/web/package.json",
      "shapes/frontend-only/apps/web/package.json",
    );
    sources.set(
      "apps/web/vite.config.ts",
      "shapes/frontend-only/apps/web/vite.config.ts",
    );
    sources.set(
      "apps/web/src/App.vue",
      "shapes/frontend-only/apps/web/src/App.vue",
    );
    sources.set("README.md", "shapes/frontend-only/README.md");
  } else {
    manifest = baseManifest;
    if (config.project.blueprint === "ecommerce") {
      sources.set(
        "apps/web/src/App.vue",
        "blueprints/ecommerce/apps/web/src/App.vue",
      );
    }
  }
  if (config.repository.taskRunner === "turborepo")
    sources.set("package.json", "package-turbo.json");
  const files = manifest.map((destination) => ({
    source: sources.get(destination) ?? destination,
    destination,
  }));
  if (config.repository.taskRunner === "turborepo")
    files.push({ source: "turbo.json", destination: "turbo.json" });
  if (config.features.docker || config.deploymentProfile === "docker") {
    files.push({ source: ".dockerignore", destination: ".dockerignore" });
    if (config.project.shape !== "frontend-only")
      files.push({
        source: "deploy/docker/Dockerfile.api",
        destination: "deploy/docker/Dockerfile.api",
      });
    if (config.project.shape !== "api-only") {
      files.push({
        source: "deploy/docker/Dockerfile.web",
        destination: "deploy/docker/Dockerfile.web",
      });
      if (config.project.shape === "frontend-only") {
        files.push({
          source: "deploy/docker/nginx-static.conf",
          destination: "deploy/docker/nginx.conf",
        });
        files.push({
          source: "deploy/docker/compose-frontend.yaml",
          destination: "docker-compose.yml",
        });
      } else {
        files.push({
          source: "deploy/docker/nginx.conf",
          destination: "deploy/docker/nginx.conf",
        });
        files.push({
          source: "deploy/docker/compose-fullstack.yaml",
          destination: "docker-compose.yml",
        });
      }
    } else {
      files.push({
        source:
          config.stack.database === "postgresql"
            ? "deploy/docker/compose-api.yaml"
            : "deploy/docker/compose-api-no-db.yaml",
        destination: "docker-compose.yml",
      });
    }
  }
  if (config.deploymentProfile === "vercel") {
    files.push({
      source: "deploy/vercel/vercel.json",
      destination: "vercel.json",
    });
    files.push({
      source: "deploy/vercel/README.md",
      destination: "deploy/vercel/README.md",
    });
  }
  if (config.deploymentProfile === "vps") {
    files.push(
      {
        source:
          config.stack.database === "postgresql"
            ? "deploy/vps/README.md"
            : "deploy/vps/README-no-db.md",
        destination: "deploy/vps/README.md",
      },
      {
        source: "deploy/vps/project-forge-api.service",
        destination: "deploy/vps/project-forge-api.service",
      },
      {
        source: "deploy/vps/Caddyfile.example",
        destination: "deploy/vps/Caddyfile.example",
      },
    );
  }
  return files;
}

export type GenerationPlan = {
  templatePack: TemplatePackId;
  projectName: string;
  profile: "minimal" | "enterprise";
  blueprint: ProjectConfig["project"]["blueprint"];
  shape: ProjectConfig["project"]["shape"];
  layout: ProjectConfig["repository"]["layout"];
  capabilities: string[];
  features: ProjectConfig["features"];
  stack: ProjectConfig["stack"];
  company: ProjectConfig["company"];
  dataMode: ProjectConfig["dataMode"];
  deploymentProfile: ProjectConfig["deploymentProfile"];
  outputDestination: ProjectConfig["output"]["destination"];
  uiLayout?: ProjectConfig["ui"]["layout"];
  files: string[];
  theme: {
    preset: ProjectConfig["theme"]["preset"];
    palette: ProjectConfig["theme"]["palette"];
    mode: "light" | "dark";
    primary: string;
    accent: string;
    radius: ProjectConfig["theme"]["radius"];
    shadow: ProjectConfig["theme"]["shadow"];
    density: ProjectConfig["theme"]["density"];
  };
};

export class ConfigurationError extends Error {
  constructor(public readonly issues: CompatibilityIssue[]) {
    super("Invalid or unsupported project configuration");
    this.name = "ConfigurationError";
  }
}

export class GenerationError extends Error {
  constructor() {
    super("Project generation failed");
    this.name = "GenerationError";
  }
}

export function assertSafeArchivePath(path: string): void {
  if (
    !path ||
    isAbsolute(path) ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":")
  )
    throw new GenerationError();
  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment === ".env" ||
        (segment.startsWith(".env.") && segment !== ".env.example"),
    )
  ) {
    throw new GenerationError();
  }
}

function parseConfig(input: unknown): ProjectConfig {
  const parsed = projectConfigSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConfigurationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: "INVALID_INPUT",
        message: issue.message,
      })),
    );
  }
  const issues = validateCompatibility(parsed.data);
  if (issues.length) throw new ConfigurationError(issues);
  return parsed.data;
}

export function resolveGeneration(input: unknown): {
  config: ProjectConfig;
  plan: GenerationPlan;
  baseFiles: RegisteredFile[];
  featureFiles: RegisteredFile[];
} {
  const config = parseConfig(input);
  const templatePack = resolveTemplatePack(config);
  const baseFiles = baseFilesFor(config);
  const featureFiles = composeFeatureFiles(config);
  const files = [
    ...baseFiles.map((file) => file.destination),
    ...featureFiles.map((file) => file.destination),
  ].sort();
  const seen = new Set<string>();
  for (const path of files) {
    assertSafeArchivePath(path);
    const key = path.toLowerCase();
    if (seen.has(key)) throw new GenerationError();
    seen.add(key);
  }
  for (const file of featureFiles) assertSafeArchivePath(file.source);
  const capabilities = [
    ...(config.features.auth || config.project.profile === "enterprise"
      ? ["auth", "company-scope"]
      : []),
    ...(config.features.rbac ? ["rbac"] : []),
    ...(config.features.navigation === "dynamic" ? ["dynamic-navigation"] : []),
    ...(config.features.audit ? ["audit"] : []),
  ];
  return {
    config,
    baseFiles,
    featureFiles,
    plan: {
      templatePack,
      projectName: config.project.name,
      profile: config.project.profile,
      blueprint: config.project.blueprint,
      shape: config.project.shape,
      layout: config.repository.layout,
      capabilities,
      features: {
        ...config.features,
        auth: config.features.auth || config.project.profile === "enterprise",
      },
      stack: { ...config.stack },
      company: { ...config.company },
      dataMode: config.dataMode,
      deploymentProfile: config.deploymentProfile,
      outputDestination: config.output.destination,
      ...(config.stack.frontend === "vue-vite"
        ? { uiLayout: config.ui.layout }
        : {}),
      files,
      theme: { ...config.theme },
    },
  };
}

export function createPlan(input: unknown): GenerationPlan {
  return resolveGeneration(input).plan;
}
