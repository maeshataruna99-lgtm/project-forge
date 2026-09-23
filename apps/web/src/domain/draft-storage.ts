import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';
import { createDefaultConfig } from './default-config';

export const DRAFT_STORAGE_KEY = 'project-forge:draft:v2';

export function loadDraft(storage: Storage): ProjectConfig {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (raw === null) return createDefaultConfig();
    const result = projectConfigSchema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
  } catch {
    // Storage may be unavailable, or the saved draft may be malformed.
  }
  clearDraft(storage);
  return createDefaultConfig();
}

export function saveDraft(storage: Storage, config: ProjectConfig): void {
  const result = projectConfigSchema.safeParse(config);
  if (!result.success) return;
  try { storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(result.data)); }
  catch { /* Browsers can block or exhaust local storage. */ }
}

export function clearDraft(storage: Storage): void {
  try { storage.removeItem(DRAFT_STORAGE_KEY); }
  catch { /* Reset the in-memory draft even when storage is unavailable. */ }
}
