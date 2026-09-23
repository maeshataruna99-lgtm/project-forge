<script setup lang="ts">
import { computed } from 'vue';
import type { GeneratorCatalog, ProjectConfig } from '@project-forge/contracts';
import { contrastRatio, describeContrast, getPaletteColors, getPresetColors, resolveThemeTokens } from '@project-forge/contracts';
import ChoiceField from '../components/ChoiceField.vue';
import ColorPicker from '../components/ColorPicker.vue';
import ThemePreview from '../components/ThemePreview.vue';
const props = defineProps<{ config: ProjectConfig; catalog: GeneratorCatalog }>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
function changePreset(value: string) {
  emit('change', 'theme.preset', value);
  const colors = getPresetColors(value as ProjectConfig['theme']['preset'], props.config.theme.mode);
  emit('change', 'theme.primary', colors.primary);
  emit('change', 'theme.accent', colors.accent);
}
function changePalette(value: string) {
  emit('change', 'theme.palette', value);
  const colors = getPaletteColors(value as ProjectConfig['theme']['palette']);
  if (colors) {
    emit('change', 'theme.primary', colors.primary);
    emit('change', 'theme.accent', colors.accent);
  }
}
function changeMode(value: string) {
  emit('change', 'theme.mode', value);
  if (props.config.theme.palette === 'custom') return;
  const colors = getPresetColors(props.config.theme.preset, value as ProjectConfig['theme']['mode']);
  emit('change', 'theme.primary', colors.primary);
  emit('change', 'theme.accent', colors.accent);
}
function changeCustomColor(name: 'primary' | 'accent', value: string) {
  if (props.config.theme.palette !== 'custom') emit('change', 'theme.palette', 'custom');
  emit('change', `theme.${name}`, value);
}
const resolvedTheme = computed(() => resolveThemeTokens(props.config.theme));
const primaryContrast = computed(() => contrastRatio(props.config.theme.primary, resolvedTheme.value.background));
const accentContrast = computed(() => contrastRatio(props.config.theme.accent, resolvedTheme.value.background));
</script>

<template>
  <section aria-labelledby="theme-heading">
    <h2 id="theme-heading" tabindex="-1">Theme</h2>
    <p class="step-description">Choose a preset and colors for the starter.</p>
    <div class="field-grid">
      <ChoiceField id="themePreset" label="Theme preset" :model-value="config.theme.preset" :choices="catalog.themes" @update:model-value="changePreset" />
      <ChoiceField id="themeMode" label="Color mode" :model-value="config.theme.mode" :choices="catalog.themeModes" @update:model-value="changeMode" />
      <ChoiceField id="themePalette" label="Color palette" :model-value="config.theme.palette" :choices="catalog.palettes" @update:model-value="changePalette" />
      <ChoiceField id="themeRadius" label="Border radius" :model-value="config.theme.radius" :choices="catalog.themeRadii" @update:model-value="emit('change', 'theme.radius', $event)" />
      <ChoiceField id="themeShadow" label="Shadow" :model-value="config.theme.shadow" :choices="catalog.themeShadows" @update:model-value="emit('change', 'theme.shadow', $event)" />
      <ChoiceField id="themeDensity" label="Density" :model-value="config.theme.density" :choices="catalog.themeDensities" @update:model-value="emit('change', 'theme.density', $event)" />
      <ColorPicker id="primary" label="Primary color" :model-value="config.theme.primary" @update:model-value="changeCustomColor('primary', $event)" />
      <ColorPicker id="accent" label="Accent color" :model-value="config.theme.accent" align-end @update:model-value="changeCustomColor('accent', $event)" />
    </div>
    <ul class="contrast-feedback" aria-label="Theme contrast feedback">
      <li :class="{ 'contrast-feedback--low': primaryContrast < 4.5 }">Primary: {{ describeContrast(primaryContrast) }}</li>
      <li :class="{ 'contrast-feedback--low': accentContrast < 4.5 }">Accent: {{ describeContrast(accentContrast) }}</li>
    </ul>
    <ThemePreview :theme="config.theme" />
  </section>
</template>
