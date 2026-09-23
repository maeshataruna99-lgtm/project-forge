<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectConfig } from '@project-forge/contracts';

const props = defineProps<{ theme: ProjectConfig['theme'] }>();
const colors = computed(() => ({ '--preview-primary': props.theme.primary, '--preview-accent': props.theme.accent }));
</script>

<template>
  <div data-testid="theme-preview" class="theme-preview" :class="`theme-preview--${theme.mode}`" :data-mode="theme.mode" :style="colors" aria-label="Live theme preview">
    <div class="preview-bar"><span>Project Forge preview</span><span>Overview</span></div>
    <div class="preview-body">
      <p class="preview-eyebrow">Welcome back</p>
      <h3>Your new workspace</h3>
      <p>See how your chosen colors look together.</p>
      <div class="preview-actions"><span class="preview-primary">Primary action</span><span class="preview-accent">Accent detail</span></div>
    </div>
  </div>
</template>
