import {
  projectConfigSchema,
  type ProjectConfig,
} from "@project-forge/contracts";
import { createDefaultConfig } from "./default-config";

export const DRAFT_STORAGE_KEY = "project-forge:draft:v4";
const PREVIOUS_DRAFT_STORAGE_KEY = "project-forge:draft:v3";
const LEGACY_DRAFT_STORAGE_KEY = "project-forge:draft:v2";

const unavailableStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

export function resolveBrowserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    return unavailableStorage;
  }
}

export function loadDraft(storage: Storage): ProjectConfig {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (raw !== null) {
      const result = projectConfigSchema.safeParse(JSON.parse(raw));
      if (result.success) return result.data;
      clearDraft(storage);
      return createDefaultConfig();
    }
    const previous = storage.getItem(PREVIOUS_DRAFT_STORAGE_KEY);
    if (previous !== null) {
      const result = projectConfigSchema.safeParse(
        migrateV3Draft(JSON.parse(previous)),
      );
      if (!result.success) {
        clearDraft(storage);
        return createDefaultConfig();
      }
      saveDraft(storage, result.data);
      storage.removeItem(PREVIOUS_DRAFT_STORAGE_KEY);
      storage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
      return result.data;
    }
    const legacy = storage.getItem(LEGACY_DRAFT_STORAGE_KEY);
    if (legacy === null) return createDefaultConfig();
    const migratedV3 = migrateV2Draft(JSON.parse(legacy));
    const result = projectConfigSchema.safeParse(migrateV3Draft(migratedV3));
    if (!result.success) {
      clearDraft(storage);
      return createDefaultConfig();
    }
    saveDraft(storage, result.data);
    storage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
    return result.data;
  } catch {
    // Storage may be unavailable, or the saved draft may be malformed.
  }
  clearDraft(storage);
  return createDefaultConfig();
}

export function saveDraft(storage: Storage, config: ProjectConfig): void {
  const result = projectConfigSchema.safeParse(config);
  if (!result.success) return;
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(result.data));
  } catch {
    /* Browsers can block or exhaust local storage. */
  }
}

export function clearDraft(storage: Storage): void {
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
    storage.removeItem(PREVIOUS_DRAFT_STORAGE_KEY);
    storage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
  } catch {
    /* Reset the in-memory draft even when storage is unavailable. */
  }
}

function migrateV2Draft(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const old = value as Record<string, unknown>;
  const project =
    old.project && typeof old.project === "object"
      ? (old.project as Record<string, unknown>)
      : {};
  const repository =
    old.repository && typeof old.repository === "object"
      ? (old.repository as Record<string, unknown>)
      : {};
  const stack =
    old.stack && typeof old.stack === "object"
      ? (old.stack as Record<string, unknown>)
      : {};
  const company =
    old.company && typeof old.company === "object"
      ? (old.company as Record<string, unknown>)
      : {};
  const features =
    old.features && typeof old.features === "object"
      ? (old.features as Record<string, unknown>)
      : {};
  const theme =
    old.theme && typeof old.theme === "object"
      ? (old.theme as Record<string, unknown>)
      : {};
  const defaults = createDefaultConfig();
  return {
    schemaVersion: 3,
    project: {
      name: project.name,
      blueprint: project.blueprint,
      shape: project.shape,
      profile: project.profile,
    },
    repository: {
      layout: repository.layout,
      packageManager: repository.packageManager,
      taskRunner: repository.taskRunner,
    },
    stack: {
      language: stack.language,
      backend: stack.backend,
      frontend: stack.frontend,
      database: stack.database,
      orm: stack.orm,
    },
    company: { mode: company.mode, superAdminScope: company.superAdminScope },
    features: {
      ...defaults.features,
      auth: features.auth,
      rbac: features.rbac,
      navigation: features.navigation,
      audit: features.audit,
      redis: features.redis,
      docker: features.docker,
    },
    dataMode: defaults.dataMode,
    deploymentProfile: defaults.deploymentProfile,
    output: defaults.output,
    theme: {
      ...defaults.theme,
      preset: theme.preset,
      mode: theme.mode,
      primary: theme.primary,
      accent: theme.accent,
    },
  };
}

function migrateV3Draft(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const old = value as Record<string, unknown>;
  return {
    ...old,
    schemaVersion: 4,
    ui: { layout: "single-column" },
  };
}
