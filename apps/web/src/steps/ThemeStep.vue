<script setup lang="ts">
import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import ChoiceField from '../components/ChoiceField.vue';
defineProps<{ config: ProjectConfig; catalog: GeneratorCatalog }>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
</script>

<template>
  <section aria-labelledby="theme-heading">
    <h2 id="theme-heading">Theme</h2>
    <p class="step-description">Choose a preset and colors for the starter.</p>
    <div class="field-grid">
      <ChoiceField id="themePreset" label="Theme preset" :model-value="config.theme.preset" :choices="catalog.themes" @update:model-value="emit('change', 'theme.preset', $event)" />
      <ChoiceField id="themeMode" label="Color mode" :model-value="config.theme.mode" :choices="catalog.themeModes" @update:model-value="emit('change', 'theme.mode', $event)" />
      <div class="field"><label for="primary">Primary color</label><input id="primary" type="color" :value="config.theme.primary" @input="emit('change', 'theme.primary', ($event.target as HTMLInputElement).value)" /></div>
      <div class="field"><label for="accent">Accent color</label><input id="accent" type="color" :value="config.theme.accent" @input="emit('change', 'theme.accent', ($event.target as HTMLInputElement).value)" /></div>
    </div>
  </section>
</template>
