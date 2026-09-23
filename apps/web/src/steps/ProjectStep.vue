<script setup lang="ts">
import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import ChoiceField from '../components/ChoiceField.vue';

defineProps<{ config: ProjectConfig; catalog: GeneratorCatalog; nameError?: string }>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
</script>

<template>
  <section aria-labelledby="project-heading">
    <h2 id="project-heading">Project</h2>
    <p class="step-description">Name your starter and choose its foundation.</p>
    <div class="field">
      <label for="projectName">Project name</label>
      <input id="projectName" name="projectName" type="text" required minlength="2" maxlength="50" pattern="[a-z][a-z0-9]*(?:-[a-z0-9]+)*" :value="config.project.name" :aria-invalid="nameError ? 'true' : undefined" :aria-describedby="nameError ? 'project-name-error' : 'project-name-help'" @input="emit('change', 'project.name', ($event.target as HTMLInputElement).value)" />
      <p id="project-name-help" class="field-help">2–50 characters; lowercase letters, numbers, and single hyphens.</p>
      <p v-if="nameError" id="project-name-error" role="alert" class="field-error">{{ nameError }}</p>
    </div>
    <div class="field-grid">
      <ChoiceField id="blueprint" label="Blueprint" :model-value="config.project.blueprint" :choices="catalog.blueprints" @update:model-value="emit('change', 'project.blueprint', $event)" />
      <ChoiceField id="shape" label="Project shape" :model-value="config.project.shape" :choices="catalog.shapes" @update:model-value="emit('change', 'project.shape', $event)" />
      <ChoiceField id="profile" label="Profile" :model-value="config.project.profile" :choices="catalog.profiles" @update:model-value="emit('change', 'project.profile', $event)" />
      <ChoiceField id="layout" label="Repository layout" :model-value="config.repository.layout" :choices="catalog.layouts" @update:model-value="emit('change', 'repository.layout', $event)" />
    </div>
  </section>
</template>
