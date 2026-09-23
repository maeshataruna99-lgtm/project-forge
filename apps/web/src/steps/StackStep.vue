<script setup lang="ts">
import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import ChoiceField from '../components/ChoiceField.vue';
defineProps<{ config: ProjectConfig; catalog: GeneratorCatalog }>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
</script>

<template>
  <section aria-labelledby="stack-heading">
    <h2 id="stack-heading" tabindex="-1">Stack</h2>
    <p class="step-description">Choose the tools used by your project.</p>
    <div class="field-grid">
      <ChoiceField id="language" label="Language" :model-value="config.stack.language" :choices="catalog.languages" @update:model-value="emit('change', 'stack.language', $event)" />
      <ChoiceField id="backend" label="Backend" :model-value="config.stack.backend" :choices="catalog.backends" @update:model-value="emit('change', 'stack.backend', $event)" />
      <ChoiceField id="frontend" label="Frontend" :model-value="config.stack.frontend" :choices="catalog.frontends" @update:model-value="emit('change', 'stack.frontend', $event)" />
      <ChoiceField id="database" label="Database" :model-value="config.stack.database" :choices="catalog.databases" @update:model-value="emit('change', 'stack.database', $event)" />
      <ChoiceField id="orm" label="ORM" :model-value="config.stack.orm" :choices="catalog.orms" @update:model-value="emit('change', 'stack.orm', $event)" />
      <ChoiceField id="packageManager" label="Package manager" :model-value="config.repository.packageManager" :choices="catalog.packageManagers" @update:model-value="emit('change', 'repository.packageManager', $event)" />
      <ChoiceField id="taskRunner" label="Task runner" :model-value="config.repository.taskRunner" :choices="catalog.taskRunners" @update:model-value="emit('change', 'repository.taskRunner', $event)" />
    </div>
  </section>
</template>
