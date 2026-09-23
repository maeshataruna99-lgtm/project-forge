// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from './App.vue';
import ProjectStep from './steps/ProjectStep.vue';

const reason = 'No generator template yet';
const available = (value: string, label: string) => ({ value, label, available: true });
const unavailable = (value: string, label: string) => ({ value, label, available: false, reason });
const catalog = {
  profiles: [available('minimal', 'Minimal'), available('enterprise', 'Enterprise')],
  blueprints: [available('blank-fullstack', 'Blank Fullstack'), available('ecommerce', 'E-commerce')],
  shapes: [available('fullstack', 'Fullstack'), unavailable('api-only', 'API only')],
  layouts: [available('monorepo', 'Monorepo'), unavailable('single-app', 'Single app')],
  languages: [available('typescript', 'TypeScript')],
  backends: [available('nestjs', 'NestJS'), unavailable('none', 'No backend')],
  frontends: [available('vue-vite', 'Vue and Vite'), unavailable('none', 'No frontend')],
  databases: [available('postgresql', 'PostgreSQL'), unavailable('none', 'No database')],
  orms: [available('prisma', 'Prisma'), unavailable('none', 'No ORM')],
  packageManagers: [available('pnpm', 'pnpm')], taskRunners: [available('none', 'None')],
  companyModes: [available('single', 'Single company'), available('multi', 'Multiple companies')],
  superAdminScopes: [available('company', 'Company'), unavailable('global', 'Global')],
  auth: [available('false', 'Disabled'), available('true', 'Enabled')],
  authStrategies: [available('jwt-refresh', 'JWT with refresh tokens'), unavailable('session', 'Session')],
  rbac: [available('false', 'Disabled'), unavailable('true', 'Enabled')],
  navigation: [available('none', 'None'), unavailable('dynamic', 'Dynamic')],
  audit: [available('false', 'Disabled'), unavailable('true', 'Enabled')],
  redis: [available('false', 'Disabled'), available('true', 'Enabled')],
  docker: [available('false', 'Disabled'), available('true', 'Enabled')],
  queue: [available('false', 'Disabled'), available('true', 'Enabled')],
  realtime: [available('false', 'Disabled'), available('true', 'Enabled')],
  apiDocs: [available('false', 'Disabled'), available('true', 'Enabled')],
  smtp: [available('false', 'Disabled'), available('true', 'Enabled')],
  uploads: [available('false', 'Disabled'), available('true', 'Enabled')],
  generatedTests: [available('false', 'Disabled'), available('true', 'Enabled')],
  logging: [available('false', 'Disabled'), available('true', 'Enabled')],
  ciCd: [available('false', 'Disabled'), available('true', 'Enabled')],
  rateLimit: [available('false', 'Disabled'), available('true', 'Enabled')],
  dataModes: [available('api-backed', 'API-backed'), available('demo', 'Demo data')],
  deploymentProfiles: ['local', 'docker', 'vercel', 'vps'].map(value => available(value, value)),
  outputDestinations: [available('zip', 'Download ZIP'), unavailable('github', 'Push to GitHub')],
  themes: ['modern-saas', 'ecommerce-store', 'admin-dashboard', 'pos', 'warehouse-industrial', 'soft-pastel', 'dark-developer', 'corporate'].map(value => available(value, value)),
  palettes: ['blue', 'emerald', 'purple', 'amber', 'rose', 'custom'].map(value => available(value, value)),
  themeModes: [available('light', 'Light'), available('dark', 'Dark')],
  themeRadii: ['none', 'small', 'medium', 'large'].map(value => available(value, value)),
  themeShadows: ['none', 'subtle', 'medium', 'strong'].map(value => available(value, value)),
  themeDensities: ['compact', 'comfortable'].map(value => available(value, value)),
};

async function setup() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(catalog)));
  const host = document.createElement('div');
  document.body.append(host);
  const wrapper = mount(App, { attachTo: host });
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  return wrapper;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); document.body.innerHTML = ''; });

describe('configuration wizard', () => {
  it('opens with defaults when the browser blocks access to local storage', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
    try {
      const wrapper = await setup();
      expect(wrapper.find('h2').text()).toBe('Project');
      expect((wrapper.get('input[name="projectName"]').element as HTMLInputElement).value).toBe('sample-app');
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('restores saved choices after remounting', async () => {
    const first = await setup();
    await first.get('input[name="projectName"]').setValue('saved-app');
    first.unmount();
    const second = await setup();
    expect((second.get('input[name="projectName"]').element as HTMLInputElement).value).toBe('saved-app');
  });

  it('asks before reset, then removes the saved draft and returns to Project', async () => {
    const wrapper = await setup();
    await wrapper.get('input[name="projectName"]').setValue('saved-app');
    await wrapper.get('button[type="submit"]').trigger('click');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    await wrapper.get('button[aria-label="Reset draft"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Stack');
    await wrapper.get('button[aria-label="Reset draft"]').trigger('click');
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(wrapper.find('h2').text()).toBe('Project');
    expect((wrapper.get('input[name="projectName"]').element as HTMLInputElement).value).toBe('sample-app');
    wrapper.unmount();
    const reopened = await setup();
    expect((reopened.get('input[name="projectName"]').element as HTMLInputElement).value).toBe('sample-app');
  });

  it('shows five named steps and advances and returns with keyboard-operable buttons', async () => {
    const wrapper = await setup();
    const names = wrapper.findAll('nav[aria-label="Wizard steps"] li button span:last-child').map(item => item.text());
    expect(names).toEqual(['Project', 'Stack', 'Organization and features', 'Theme', 'Review and generate']);
    expect(wrapper.find('h2').text()).toBe('Project');
    await wrapper.get('button[type="submit"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Stack');
    await wrapper.get('button[aria-label="Back to Project"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Project');
    expect(wrapper.get('button[aria-label="Go to Stack"]').attributes('disabled')).toBeDefined();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.find('h2').text()).toBe('Stack');
    await wrapper.get('button[aria-label="Go to Project"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Project');
  });

  it('requires a schema-compatible project name and associates the error with its input', async () => {
    const wrapper = await setup();
    const input = wrapper.get('input[name="projectName"]');
    expect(input.attributes('minlength')).toBe('2');
    expect(input.attributes('maxlength')).toBe('50');
    await input.setValue('Bad Name');
    await wrapper.get('button[type="submit"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Project');
    const error = wrapper.get('[role="alert"]');
    expect(error.text()).toMatch(/lowercase/i);
    expect(input.attributes('aria-describedby')?.split(' ')).toEqual(['project-name-help', error.attributes('id')]);
    await input.setValue('valid-app');
    await wrapper.get('button[type="submit"]').trigger('click');
    expect(wrapper.find('h2').text()).toBe('Stack');
  });

  it('labels selects and keeps unsupported stack choices disabled with adjacent reasons', async () => {
    const wrapper = await setup();
    expect(wrapper.get('label[for="blueprint"]').text()).toMatch(/blueprint/i);
    expect(wrapper.get('select#blueprint option[value="ecommerce"]').attributes('disabled')).toBeUndefined();
    await wrapper.get('select#blueprint').setValue('ecommerce');
    await wrapper.get('button[type="submit"]').trigger('click');
    expect(wrapper.get('select#backend option[value="none"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#backend-reasons').text()).toContain(`No backend: ${reason}`);
    await wrapper.get('button[aria-label="Back to Project"]').trigger('click');
    expect((wrapper.get('select#blueprint').element as HTMLSelectElement).value).toBe('ecommerce');
  });

  it('lets a keyboard user traverse every step and change an available theme choice', async () => {
    const wrapper = await setup();
    for (const heading of ['Stack', 'Organization and features', 'Theme', 'Review and generate']) {
      await wrapper.get('button[type="submit"]').trigger('click');
      expect(wrapper.find('h2').text()).toBe(heading);
    }
    await wrapper.get('button[aria-label="Back to Theme"]').trigger('click');
    const mode = wrapper.get('select#themeMode');
    await mode.setValue('dark');
    expect((mode.element as HTMLSelectElement).value).toBe('dark');
    expect(wrapper.get('[data-testid="theme-preview"]').attributes('data-mode')).toBe('dark');
    expect(wrapper.find('#themePalette').exists()).toBe(true);
    expect(wrapper.find('#themeRadius').exists()).toBe(true);
    expect(wrapper.find('#themeShadow').exists()).toBe(true);
    expect(wrapper.find('#themeDensity').exists()).toBe(true);
    expect(wrapper.get('.contrast-feedback').text()).toMatch(/Primary: Contrast/);
    await wrapper.get('#themePreset').setValue('ecommerce-store');
    expect((wrapper.get('#themePreset').element as HTMLSelectElement).value).toBe('ecommerce-store');
    expect(wrapper.get('[data-testid="theme-preview"]').attributes('data-preset')).toBe('ecommerce-store');
    expect((wrapper.get('#primary').element as HTMLInputElement).value).toBe('#fb923c');
  });

  it('exposes the supported data, deployment, and optional integration controls', async () => {
    const wrapper = await setup();
    await wrapper.get('button[type="submit"]').trigger('click');
    for (const id of ['deploymentProfile', 'dataMode']) expect(wrapper.find(`#${id}`).exists()).toBe(true);
    await wrapper.get('button[type="submit"]').trigger('click');
    for (const id of ['redis', 'docker', 'queue', 'realtime', 'apiDocs', 'smtp', 'uploads', 'generatedTests', 'logging', 'ciCd', 'rateLimit']) {
      expect(wrapper.find(`#${id}`).exists(), id).toBe(true);
    }
  });

  it('moves focus to each new heading after Next, Back, and step navigation', async () => {
    const wrapper = await setup();
    await wrapper.get('button[type="submit"]').trigger('click');
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    expect(wrapper.get('h2').attributes('tabindex')).toBe('-1');
    await wrapper.get('button[type="submit"]').trigger('click');
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    await wrapper.get('button[aria-label="Go to Project"]').trigger('click');
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    await wrapper.get('button[type="submit"]').trigger('click');
    await wrapper.get('button[aria-label="Back to Project"]').trigger('click');
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
  });

  it('rejects an invalid config update without changing the selected choice', async () => {
    const wrapper = await setup();
    wrapper.getComponent(ProjectStep).vm.$emit('change', 'project.blueprint', 'missing-template');
    await nextTick();
    expect((wrapper.get('#blueprint').element as HTMLSelectElement).value).toBe('blank-fullstack');
    await wrapper.get('button[type="submit"]').trigger('click');
    await wrapper.get('button[aria-label="Back to Project"]').trigger('click');
    expect((wrapper.get('#blueprint').element as HTMLSelectElement).value).toBe('blank-fullstack');
  });
});
