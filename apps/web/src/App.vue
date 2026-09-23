<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { projectConfigSchema, type GeneratorCatalog } from '@project-forge/contracts';
import { downloadArchive, fetchCatalog, GeneratorApiError, type GenerationPlan, validateConfig } from './api/generator';
import { resolveBrowserStorage } from './domain/draft-storage';
import { createWizardState } from './domain/wizard-state';
import WizardStepper from './components/WizardStepper.vue';
import ProjectStep from './steps/ProjectStep.vue';
import StackStep from './steps/StackStep.vue';
import OrganizationStep from './steps/OrganizationStep.vue';
import ThemeStep from './steps/ThemeStep.vue';
import ReviewStep from './steps/ReviewStep.vue';

const steps = ['Project', 'Stack', 'Organization and features', 'Theme', 'Review and generate'] as const;
const wizard = createWizardState(resolveBrowserStorage());
const { config, current, update: updateConfig, back, navigate } = wizard;
const catalog = ref<GeneratorCatalog | null>(null);
const catalogError = ref('');
const nameError = ref('');
const projectNameDraft = ref(config.value.project.name);
const wizardForm = ref<HTMLFormElement | null>(null);
const plan = ref<GenerationPlan>();
const validationError = ref<GeneratorApiError>();
const archiveError = ref<GeneratorApiError>();
const validating = ref(false);
const archiveState = ref<'idle' | 'downloading' | 'error' | 'complete'>('idle');
let validationRevision = 0;
let archiveRevision = 0;
let validatedConfig = '';

onMounted(async () => {
  try { catalog.value = await fetchCatalog(); }
  catch (error) { catalogError.value = error instanceof Error ? error.message : 'Could not load choices.'; }
});

watch(current, async () => {
  if (current.value === 4) void validate();
  await nextTick();
  wizardForm.value?.querySelector('h2')?.focus();
});

function invalidateValidation() {
  validationRevision++;
  archiveRevision++;
  validatedConfig = '';
  plan.value = undefined;
  validationError.value = undefined;
  archiveError.value = undefined;
  validating.value = false;
  archiveState.value = 'idle';
}

function asApiError(error: unknown): GeneratorApiError {
  return error instanceof GeneratorApiError ? error : new GeneratorApiError(error instanceof Error ? error.message : 'Request failed');
}

async function validate() {
  if (validating.value) return;
  const revision = ++validationRevision;
  archiveRevision++;
  const snapshot = JSON.stringify(config.value);
  validatedConfig = '';
  plan.value = undefined;
  validationError.value = undefined;
  archiveError.value = undefined;
  archiveState.value = 'idle';
  validating.value = true;
  try {
    const result = await validateConfig(config.value);
    if (revision !== validationRevision || snapshot !== JSON.stringify(config.value)) return;
    plan.value = result;
    validatedConfig = snapshot;
  } catch (error) {
    if (revision === validationRevision) validationError.value = asApiError(error);
  } finally {
    if (revision === validationRevision) validating.value = false;
  }
}

async function archive() {
  const snapshot = JSON.stringify(config.value);
  if (!plan.value || validating.value || archiveState.value === 'downloading' || snapshot !== validatedConfig) return;
  const revision = ++archiveRevision;
  archiveState.value = 'downloading';
  archiveError.value = undefined;
  try {
    const { blob, filename } = await downloadArchive(config.value);
    if (revision !== archiveRevision || snapshot !== validatedConfig) return;
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      try { link.click(); } finally { link.remove(); }
    } finally {
      URL.revokeObjectURL(url);
    }
    archiveState.value = 'complete';
  } catch (error) {
    if (revision !== archiveRevision) return;
    archiveError.value = asApiError(error);
    archiveState.value = 'error';
  }
}

function update(path: string, value: string) {
  if (path === 'project.name') {
    projectNameDraft.value = value;
    nameError.value = '';
  }
  if (updateConfig(path, value)) invalidateValidation();
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
  invalidateValidation();
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
        <ReviewStep v-else :config="config" :plan="plan" :validation-error="validationError" :archive-error="archiveError" :validating="validating" :archive-state="archiveState" @validate="validate" @download="archive" />
        <div class="wizard-actions">
          <button v-if="current > 0" type="button" class="button-secondary" :aria-label="`Back to ${steps[current - 1]}`" @click="back">Back</button>
          <span v-else></span>
          <button v-if="current < steps.length - 1" type="submit" class="button-primary" @click.prevent="next">Continue</button>
        </div>
      </form>
    </template>
  </main>
</template>
