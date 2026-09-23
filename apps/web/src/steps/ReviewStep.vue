<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectConfig } from '@project-forge/contracts';
import type { GenerationPlan } from '../api/generator';
import { GeneratorApiError } from '../api/generator';
import FileTree from '../components/FileTree.vue';
import ThemePreview from '../components/ThemePreview.vue';

const props = defineProps<{
  config: ProjectConfig;
  plan?: GenerationPlan;
  validationError?: GeneratorApiError;
  archiveError?: GeneratorApiError;
  validating: boolean;
  archiveState: 'idle' | 'downloading' | 'error' | 'complete';
}>();
const emit = defineEmits<{ validate: []; download: [] }>();
const settings = computed(() => Object.entries(props.config)
  .filter(([section]) => section !== 'schemaVersion')
  .flatMap(([section, values]) => Object.entries(values).map(([name, value]) => ({ path: `${section}.${name}`, value: String(value) }))));
function issueFor(path: string) { return props.validationError?.issues?.filter(issue => issue.path === path) ?? []; }
</script>

<template>
  <section aria-labelledby="review-heading">
    <h2 id="review-heading" tabindex="-1">Review and generate</h2>
    <p class="step-description">Check your choices and generated files before downloading.</p>
    <p v-if="config.dataMode === 'demo'" class="demo-data-notice" role="note">Demo data is saved only in this browser. It is not secure, shared, or durable. Server-side authentication and authorization are unavailable in this mode.</p>
    <dl class="review-summary">
      <div v-for="setting in settings" :key="setting.path" :data-config-path="setting.path">
        <dt>{{ setting.path }}</dt><dd>{{ setting.value }}</dd>
        <p v-for="(issue, index) in issueFor(setting.path)" :key="index" role="alert" class="field-error">{{ issue.message }}</p>
      </div>
    </dl>
    <ThemePreview :theme="config.theme" />
    <p v-if="validating" role="status">Validating configuration…</p>
    <div v-if="validationError" role="alert" class="field-error">
      <p>{{ validationError.message }}</p>
      <ul v-if="validationError.issues?.length"><li v-for="(issue, index) in validationError.issues" :key="index"><strong>{{ issue.path }}:</strong> {{ issue.message }}</li></ul>
      <p v-if="validationError.correlationId">Request ID: {{ validationError.correlationId }}</p>
    </div>
    <FileTree v-if="plan" :files="plan.files" />
    <div class="review-actions">
      <button type="button" class="button-secondary" :disabled="validating || archiveState === 'downloading'" @click="emit('validate')">{{ validationError ? 'Retry validation' : 'Validate again' }}</button>
      <button type="button" class="button-primary" aria-label="Download ZIP archive" :disabled="!plan || validating || archiveState === 'downloading'" @click="emit('download')">{{ archiveState === 'downloading' ? 'Preparing ZIP…' : 'Download ZIP' }}</button>
    </div>
    <div v-if="archiveError" role="alert" class="field-error"><p>{{ archiveError.message }}</p><p v-if="archiveError.correlationId">Request ID: {{ archiveError.correlationId }}</p></div>
    <p v-if="archiveState === 'complete'" role="status">ZIP download started.</p>
  </section>
</template>
