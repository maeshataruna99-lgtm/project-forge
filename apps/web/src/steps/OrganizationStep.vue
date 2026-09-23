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
    </div>
  </section>
</template>
