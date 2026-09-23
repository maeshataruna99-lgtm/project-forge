<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectConfig } from '@project-forge/contracts';
import { resolveThemeTokens } from '@project-forge/contracts';

const props = defineProps<{ theme: ProjectConfig['theme'] }>();
const tokens = computed(() => resolveThemeTokens(props.theme));
const colors = computed(() => ({
  '--preview-primary': tokens.value.primary,
  '--preview-accent': tokens.value.accent,
  '--preview-background': tokens.value.background,
  '--preview-surface': tokens.value.surface,
  '--preview-text': tokens.value.text,
  '--preview-radius': tokens.value.radius,
  '--preview-shadow': tokens.value.shadow,
  '--preview-density-gap': tokens.value.densityGap,
}));
</script>

<template>
  <div data-testid="theme-preview" class="theme-preview" :class="`theme-preview--${theme.mode}`" :data-mode="theme.mode" :data-preset="theme.preset" :data-palette="theme.palette" :style="colors" role="img" aria-label="Live theme preview">
    <div class="preview-bar"><span>Project Forge preview</span><span>Overview</span></div>
    <div class="preview-body">
      <p class="preview-eyebrow">Welcome back</p>
      <h3>Your new workspace</h3>
      <p>See how your chosen colors look together.</p>
      <div class="preview-actions"><span class="preview-primary">Primary action</span><span class="preview-accent">Accent detail</span></div>
    </div>
  </div>
</template>
