// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '../App.vue';
import { catalog } from '../../../../packages/template-registry/src/index';

const plan = { projectName: 'sample-app', profile: 'minimal', files: ['apps/web/src/App.vue', 'packages/contracts/src/index.ts'], theme: { mode: 'light', primary: '#2563EB', accent: '#F59E0B' } };
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };

async function setup(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div'); document.body.append(host);
  const wrapper = mount(App, { attachTo: host });
  await tick();
  return wrapper;
}

async function review(wrapper: Awaited<ReturnType<typeof setup>>) {
  for (let i = 0; i < 4; i++) await wrapper.get('button[type="submit"]').trigger('click');
  await tick();
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); document.body.innerHTML = ''; });

describe('catalog to validated ZIP journey', () => {
  it('updates the live theme preview when colors and mode change', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(catalog));
    const wrapper = await setup(fetchMock);
    for (let i = 0; i < 3; i++) await wrapper.get('button[type="submit"]').trigger('click');
    await wrapper.get('select#themeMode').setValue('dark');
    await wrapper.get('input#primary').setValue('#123456');
    const preview = wrapper.get('[data-testid="theme-preview"]');
    expect(preview.attributes('data-mode')).toBe('dark');
    expect(preview.attributes('style')).toContain('--preview-primary: #123456');
  });

  it('shows the validated file tree and downloads once with the safe response name', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValueOnce(Response.json(plan))
      .mockResolvedValueOnce(new Response(new Uint8Array([80, 75]), { status: 201, headers: { 'Content-Disposition': 'attachment; filename="safe.zip"' } }));
    const create = vi.fn().mockReturnValue('blob:test'); const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const downloads: string[] = [];
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    expect(wrapper.text()).toContain('apps/web/src/App.vue');
    expect(wrapper.get('button[aria-label="Download ZIP archive"]').attributes('disabled')).toBeUndefined();
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(downloads).toEqual(['safe.zip']);
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:test');
  });

  it('shows validation field errors and correlation ID, retains draft, and disables archive', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json({ code: 'INVALID_CONFIGURATION', issues: [{ path: 'theme.mode', message: 'Unsupported mode' }], correlationId: 'request-123' }, { status: 400 }));
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    expect(wrapper.text()).toContain('theme.mode');
    expect(wrapper.text()).toContain('Unsupported mode');
    expect(wrapper.get('[data-config-path="theme.mode"] [role="alert"]').text()).toContain('Unsupported mode');
    expect(wrapper.text()).toContain('request-123');
    expect(wrapper.get('button[aria-label="Download ZIP archive"]').attributes('disabled')).toBeDefined();
    await wrapper.get('button[aria-label="Back to Theme"]').trigger('click');
    expect((wrapper.get('select#themeMode').element as HTMLSelectElement).value).toBe('light');
  });

  it('invalidates an old plan after configuration changes and retries validation', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json(plan)).mockResolvedValueOnce(Response.json({ ...plan, theme: { ...plan.theme, mode: 'dark' } }));
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    await wrapper.get('button[aria-label="Back to Theme"]').trigger('click');
    await wrapper.get('select#themeMode').setValue('dark');
    await wrapper.get('button[type="submit"]').trigger('click');
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(wrapper.text()).toContain('apps/web/src/App.vue');
  });

  it('recovers from archive failure without losing configuration', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json(plan)).mockResolvedValueOnce(Response.json({ code: 'GENERATOR_BUSY', correlationId: 'archive-456' }, { status: 429 }));
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    await tick();
    expect(wrapper.text()).toContain('archive-456');
    expect(wrapper.get('button[aria-label="Download ZIP archive"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).toContain('sample-app');
  });

  it('uses the project ZIP name for an unsafe response name and prevents duplicate submissions', async () => {
    let finishArchive!: (response: Response) => void;
    const archiveResponse = new Promise<Response>(resolve => { finishArchive = resolve; });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json(plan)).mockReturnValueOnce(archiveResponse);
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:test'), revokeObjectURL: vi.fn() });
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    expect(wrapper.get('button[aria-label="Download ZIP archive"]').attributes('disabled')).toBeDefined();
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    finishArchive(new Response(new Uint8Array([80, 75]), { status: 201, headers: { 'Content-Disposition': 'attachment; filename="../../unsafe.zip"' } }));
    await tick();
    expect(downloads).toEqual(['sample-app.zip']);
  });

  it('ignores a stale archive failure after the configuration changes and validates again', async () => {
    let failArchive!: (error: Error) => void;
    const archiveResponse = new Promise<Response>((_resolve, reject) => { failArchive = reject; });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json(plan))
      .mockReturnValueOnce(archiveResponse)
      .mockResolvedValueOnce(Response.json({ ...plan, theme: { ...plan.theme, mode: 'dark' } }));
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    await wrapper.get('button[aria-label="Back to Theme"]').trigger('click');
    await wrapper.get('select#themeMode').setValue('dark');
    await wrapper.get('button[type="submit"]').trigger('click');
    await tick();
    failArchive(new Error('Old archive failed'));
    await tick();
    expect(wrapper.text()).not.toContain('Old archive failed');
    expect(wrapper.get('button[aria-label="Download ZIP archive"]').attributes('disabled')).toBeUndefined();
  });

  it('ignores a stale archive success even if the configuration returns to its original value', async () => {
    let finishArchive!: (response: Response) => void;
    const archiveResponse = new Promise<Response>(resolve => { finishArchive = resolve; });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(catalog)).mockResolvedValueOnce(Response.json(plan))
      .mockReturnValueOnce(archiveResponse).mockResolvedValueOnce(Response.json(plan));
    const create = vi.fn().mockReturnValue('blob:test');
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: vi.fn() });
    const wrapper = await setup(fetchMock);
    await review(wrapper);
    await wrapper.get('button[aria-label="Download ZIP archive"]').trigger('click');
    await wrapper.get('button[aria-label="Back to Theme"]').trigger('click');
    await wrapper.get('select#themeMode').setValue('dark');
    await wrapper.get('select#themeMode').setValue('light');
    await wrapper.get('button[type="submit"]').trigger('click');
    await tick();
    finishArchive(new Response(new Uint8Array([80, 75]), { status: 201 }));
    await tick();
    expect(create).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('ZIP download started');
  });
});
