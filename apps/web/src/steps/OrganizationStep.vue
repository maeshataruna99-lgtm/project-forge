<script setup lang="ts">
import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import ChoiceField from '../components/ChoiceField.vue';
defineProps<{ config: ProjectConfig; catalog: GeneratorCatalog }>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
</script>

<template>
  <section aria-labelledby="organization-heading">
    <h2 id="organization-heading" tabindex="-1">Organization and features</h2>
    <p class="step-description">Set the company model and optional capabilities.</p>
    <div class="field-grid">
      <ChoiceField id="companyMode" label="Company mode" :model-value="config.company.mode" :choices="catalog.companyModes" @update:model-value="emit('change', 'company.mode', $event)" />
      <ChoiceField id="superAdminScope" label="Super-admin scope" :model-value="config.company.superAdminScope" :choices="catalog.superAdminScopes" @update:model-value="emit('change', 'company.superAdminScope', $event)" />
      <ChoiceField id="auth" label="Authentication" :model-value="String(config.features.auth)" :choices="catalog.auth" @update:model-value="emit('change', 'features.auth', $event)" />
      <ChoiceField id="rbac" label="Role-based access" :model-value="String(config.features.rbac)" :choices="catalog.rbac" @update:model-value="emit('change', 'features.rbac', $event)" />
      <ChoiceField id="navigation" label="Navigation" :model-value="config.features.navigation" :choices="catalog.navigation" @update:model-value="emit('change', 'features.navigation', $event)" />
      <ChoiceField id="audit" label="Audit" :model-value="String(config.features.audit)" :choices="catalog.audit" @update:model-value="emit('change', 'features.audit', $event)" />
      <ChoiceField id="redis" label="Redis" :model-value="String(config.features.redis)" :choices="catalog.redis" @update:model-value="emit('change', 'features.redis', $event)" />
      <ChoiceField id="docker" label="Docker" :model-value="String(config.features.docker)" :choices="catalog.docker" @update:model-value="emit('change', 'features.docker', $event)" />
      <ChoiceField id="queue" label="Queue" :model-value="String(config.features.queue)" :choices="catalog.queue" @update:model-value="emit('change', 'features.queue', $event)" />
      <ChoiceField id="realtime" label="Realtime" :model-value="String(config.features.realtime)" :choices="catalog.realtime" @update:model-value="emit('change', 'features.realtime', $event)" />
      <ChoiceField id="apiDocs" label="API documentation" :model-value="String(config.features.apiDocs)" :choices="catalog.apiDocs" @update:model-value="emit('change', 'features.apiDocs', $event)" />
      <ChoiceField id="smtp" label="SMTP email" :model-value="String(config.features.smtp)" :choices="catalog.smtp" @update:model-value="emit('change', 'features.smtp', $event)" />
      <ChoiceField id="uploads" label="Uploads" :model-value="String(config.features.uploads)" :choices="catalog.uploads" @update:model-value="emit('change', 'features.uploads', $event)" />
      <ChoiceField id="generatedTests" label="Generated tests" :model-value="String(config.features.generatedTests)" :choices="catalog.generatedTests" @update:model-value="emit('change', 'features.generatedTests', $event)" />
      <ChoiceField id="logging" label="Structured logging" :model-value="String(config.features.logging)" :choices="catalog.logging" @update:model-value="emit('change', 'features.logging', $event)" />
      <ChoiceField id="ciCd" label="CI workflow" :model-value="String(config.features.ciCd)" :choices="catalog.ciCd" @update:model-value="emit('change', 'features.ciCd', $event)" />
      <ChoiceField id="rateLimit" label="API rate limit" :model-value="String(config.features.rateLimit)" :choices="catalog.rateLimit" @update:model-value="emit('change', 'features.rateLimit', $event)" />
    </div>
  </section>
</template>
