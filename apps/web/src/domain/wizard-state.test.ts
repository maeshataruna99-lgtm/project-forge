// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createWizardState } from './wizard-state';
import { DRAFT_STORAGE_KEY } from './draft-storage';

beforeEach(() => localStorage.clear());

describe('wizard state', () => {
  it('persists valid changes and restores them on a new visit', () => {
    const wizard = createWizardState(localStorage);
    expect(wizard.update('project.name', 'saved-app')).toBe(true);
    expect(wizard.update('theme.mode', 'dark')).toBe(true);
    expect(createWizardState(localStorage).config.value.project.name).toBe('saved-app');
    expect(createWizardState(localStorage).config.value.theme.mode).toBe('dark');
  });

  it('rejects invalid changes without overwriting a valid draft', () => {
    const wizard = createWizardState(localStorage);
    wizard.update('project.name', 'saved-app');
    expect(wizard.update('project.name', 'Bad Name')).toBe(false);
    expect(wizard.update('missing.field', 'x')).toBe(false);
    expect(createWizardState(localStorage).config.value.project.name).toBe('saved-app');
  });

  it('tracks navigation and reset clears storage and restores defaults', () => {
    const wizard = createWizardState(localStorage);
    wizard.update('project.name', 'saved-app');
    wizard.next();
    wizard.next();
    expect(wizard.current.value).toBe(2);
    wizard.back();
    expect(wizard.current.value).toBe(1);
    wizard.navigate(0);
    expect(wizard.current.value).toBe(0);
    wizard.next();
    wizard.reset();
    expect(wizard.current.value).toBe(0);
    expect(wizard.config.value.project.name).toBe('sample-app');
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
