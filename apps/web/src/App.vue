<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { projectConfigSchema, type GeneratorCatalog, type ProjectConfig } from '@project-forge/contracts';
import { fetchCatalog } from './api/generator';
import WizardStepper from './components/WizardStepper.vue';
import ProjectStep from './steps/ProjectStep.vue';
import StackStep from './steps/StackStep.vue';
import OrganizationStep from './steps/OrganizationStep.vue';
import ThemeStep from './steps/ThemeStep.vue';

const steps = ['Project', 'Stack', 'Organization and features', 'Theme', 'Review and generate'] as const;
const current = ref(0);
const catalog = ref<GeneratorCatalog | null>(null);
const catalogError = ref('');
const nameError = ref('');
const projectNameDraft = ref('sample-app');
const wizardForm = ref<HTMLFormElement | null>(null);
const config = ref<ProjectConfig>({
  schemaVersion: 2,
  project: { name: 'sample-app', blueprint: 'blank-fullstack', shape: 'fullstack', profile: 'minimal' },
  repository: { layout: 'monorepo', packageManager: 'pnpm', taskRunner: 'none' },
  stack: { language: 'typescript', backend: 'nestjs', frontend: 'vue-vite', database: 'postgresql', orm: 'prisma' },
  company: { mode: 'single', superAdminScope: 'company' },
  features: { auth: false, rbac: false, navigation: 'none', audit: false, redis: false, docker: false },
  theme: { preset: 'modern-saas', mode: 'light', primary: '#2563EB', accent: '#F59E0B' },
});

onMounted(async () => {
  try { catalog.value = await fetchCatalog(); }
  catch (error) { catalogError.value = error instanceof Error ? error.message : 'Could not load choices.'; }
});

watch(current, async () => {
  await nextTick();
  wizardForm.value?.querySelector('h2')?.focus();
});

function update(path: string, value: string) {
  const [section, key, extra] = path.split('.');
  if (!section || !key || extra || !(section in config.value)) return;
  if (path === 'project.name') {
    projectNameDraft.value = value;
    nameError.value = '';
  }
  const original = config.value[section as keyof ProjectConfig];
  if (typeof original !== 'object') return;
  const nextValue = section === 'features' && key !== 'navigation' ? value === 'true' : value;
  const result = projectConfigSchema.safeParse({ ...config.value, [section]: { ...original, [key]: nextValue } });
  if (result.success) config.value = result.data;
}

function validProjectName() {
  const result = projectConfigSchema.shape.project.shape.name.safeParse(projectNameDraft.value);
  nameError.value = result.success ? '' : (result.error.issues[0]?.message ?? 'Enter a valid project name.');
  return result.success;
}

function next() {
  if (current.value === 0 && !validProjectName()) return;
  if (current.value < steps.length - 1) current.value++;
}
function back() { if (current.value > 0) current.value--; }
function navigate(index: number) { if (index >= 0 && index < current.value) current.value = index; }
</script>

<template>
  <main class="app-shell">
    <header class="page-header">
      <p class="eyebrow">Starter project builder</p>
      <h1>Project Forge</h1>
      <p>Configure a starter project one step at a time.</p>
    </header>
    <p v-if="catalogError" role="alert" class="load-error">Unable to load project choices: {{ catalogError }}</p>
    <p v-else-if="!catalog" role="status">Loading project choices…</p>
    <template v-else>
      <WizardStepper :steps="steps" :current="current" @navigate="navigate" />
      <form ref="wizardForm" class="wizard-card" novalidate @submit.prevent="next">
        <ProjectStep v-if="current === 0" :config="config" :catalog="catalog" :project-name="projectNameDraft" :name-error="nameError" @change="update" />
        <StackStep v-else-if="current === 1" :config="config" :catalog="catalog" @change="update" />
        <OrganizationStep v-else-if="current === 2" :config="config" :catalog="catalog" @change="update" />
        <ThemeStep v-else-if="current === 3" :config="config" :catalog="catalog" @change="update" />
        <section v-else aria-labelledby="review-heading">
          <h2 id="review-heading" tabindex="-1">Review and generate</h2>
          <p class="step-description">Review and generation will be available in the next step of this build.</p>
          <p><strong>Project:</strong> {{ config.project.name }}</p>
        </section>
        <div class="wizard-actions">
          <button v-if="current > 0" type="button" class="button-secondary" :aria-label="`Back to ${steps[current - 1]}`" @click="back">Back</button>
          <span v-else></span>
          <button v-if="current < steps.length - 1" type="submit" class="button-primary" @click.prevent="next">Continue</button>
        </div>
      </form>
    </template>
  </main>
</template>
