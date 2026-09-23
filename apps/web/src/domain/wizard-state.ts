import { ref } from 'vue';
import { projectConfigSchema, type ProjectConfig } from '@project-forge/contracts';
import { createDefaultConfig } from './default-config';
import { clearDraft, loadDraft, saveDraft } from './draft-storage';

const LAST_STEP = 4;

export function createWizardState(storage: Storage) {
  const config = ref<ProjectConfig>(loadDraft(storage));
  const current = ref(0);

  function update(path: string, value: string): boolean {
    const [section, key, extra] = path.split('.');
    if (!section || !key || extra || !(section in config.value)) return false;
    const original = config.value[section as keyof ProjectConfig];
    if (typeof original !== 'object') return false;
    const nextValue = section === 'features' && key !== 'navigation' ? value === 'true' : value;
    const result = projectConfigSchema.safeParse({ ...config.value, [section]: { ...original, [key]: nextValue } });
    if (!result.success) return false;
    config.value = result.data;
    saveDraft(storage, result.data);
    return true;
  }

  function next() { if (current.value < LAST_STEP) current.value++; }
  function back() { if (current.value > 0) current.value--; }
  function navigate(index: number) { if (index >= 0 && index < current.value) current.value = index; }
  function reset() {
    clearDraft(storage);
    config.value = createDefaultConfig();
    current.value = 0;
  }

  return { config, current, update, next, back, navigate, reset };
}
