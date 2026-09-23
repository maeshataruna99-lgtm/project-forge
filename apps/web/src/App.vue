<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { projectConfigSchema, type GeneratorCatalog } from '@project-forge/contracts';
import { fetchCatalog } from './api/generator';
import { resolveBrowserStorage } from './domain/draft-storage';
import { createWizardState } from './domain/wizard-state';
import WizardStepper from './components/WizardStepper.vue';
import ProjectStep from './steps/ProjectStep.vue';
import StackStep from './steps/StackStep.vue';
import OrganizationStep from './steps/OrganizationStep.vue';
import ThemeStep from './steps/ThemeStep.vue';

const steps = ['Project', 'Stack', 'Organization and features', 'Theme', 'Review and generate'] as const;
const wizard = createWizardState(resolveBrowserStorage());
const { config, current, update: updateConfig, back, navigate } = wizard;
const catalog = ref<GeneratorCatalog | null>(null);
const catalogError = ref('');
const nameError = ref('');
const projectNameDraft = ref(config.value.project.name);
const wizardForm = ref<HTMLFormElement | null>(null);

onMounted(async () => {
  try { catalog.value = await fetchCatalog(); }
  catch (error) { catalogError.value = error instanceof Error ? error.message : 'Could not load choices.'; }
});

watch(current, async () => {
  await nextTick();
  wizardForm.value?.querySelector('h2')?.focus();
});

function update(path: string, value: string) {
  if (path === 'project.name') {
    projectNameDraft.value = value;
    nameError.value = '';
  }
  updateConfig(path, value);
}

function validProjectName() {
  const result = projectConfigSchema.shape.project.shape.name.safeParse(projectNameDraft.value);
  nameError.value = result.success ? '' : (result.error.issues[0]?.message ?? 'Enter a valid project name.');
  return result.success;
}

function next() {
  if (current.value === 0 && !validProjectName()) return;
  wizard.next();
}
function resetDraft() {
  if (!window.confirm('Discard your saved draft and start again?')) return;
  wizard.reset();
  projectNameDraft.value = config.value.project.name;
  nameError.value = '';
}
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
      <div class="draft-actions"><button type="button" class="button-secondary" aria-label="Reset draft" @click="resetDraft">Reset draft</button></div>
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
