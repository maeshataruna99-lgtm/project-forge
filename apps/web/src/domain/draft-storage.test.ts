// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { projectConfigSchema } from '@project-forge/contracts';
import example from '../../../../examples/minimal-config.json';
import { createDefaultConfig } from './default-config';
import { DRAFT_STORAGE_KEY, clearDraft, loadDraft, saveDraft } from './draft-storage';

beforeEach(() => localStorage.clear());

describe('draft storage', () => {
  it('starts with the valid minimal example', () => {
    expect(createDefaultConfig()).toEqual(example);
    expect(projectConfigSchema.safeParse(createDefaultConfig()).success).toBe(true);
    expect(createDefaultConfig('other-app').project.name).toBe('other-app');
  });

  it('round trips a valid configuration', () => {
    const config = createDefaultConfig('saved-app');
    saveDraft(localStorage, config);
    expect(loadDraft(localStorage)).toEqual(config);
  });

  it('migrates a schema v2 draft and preserves prior choices', () => {
    const legacy = {
      ...example,
      schemaVersion: 2,
      project: { ...example.project, name: 'old-project' },
    };
    localStorage.setItem('project-forge:draft:v2', JSON.stringify(legacy));

    const migrated = loadDraft(localStorage);

    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.project.name).toBe('old-project');
    expect(migrated.output.destination).toBe('zip');
    expect(migrated.dataMode).toBe('api-backed');
    expect(localStorage.getItem('project-forge:draft:v2')).toBeNull();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toEqual(JSON.stringify(migrated));
  });

  it.each([
    ['malformed JSON', '{'],
    ['old schema', JSON.stringify({ ...example, schemaVersion: 1 })],
    ['invalid structure', JSON.stringify({ ...example, project: { ...example.project, name: 'Bad Name' } })],
  ])('discards %s and restores defaults', (_description, value) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, value);
    expect(loadDraft(localStorage)).toEqual(example);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('does not save an invalid configuration', () => {
    saveDraft(localStorage, { ...createDefaultConfig(), schemaVersion: 1 } as never);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('falls back when storage operations throw', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
      clear: () => { throw new Error('blocked'); },
      key: () => null,
      length: 0,
    } satisfies Storage;
    expect(loadDraft(blocked)).toEqual(example);
    expect(() => saveDraft(blocked, createDefaultConfig())).not.toThrow();
    expect(() => clearDraft(blocked)).not.toThrow();
  });

  it('clears the saved draft', () => {
    saveDraft(localStorage, createDefaultConfig('saved-app'));
    clearDraft(localStorage);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
