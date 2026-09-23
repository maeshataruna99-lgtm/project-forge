<script setup lang="ts">
import { computed } from "vue";
import {
  resolveThemeTokens,
  type ProjectConfig,
  type UiLayout,
} from "@project-forge/contracts";

const props = withDefaults(
  defineProps<{
    layout: UiLayout;
    theme: ProjectConfig["theme"];
    size?: "card" | "large";
  }>(),
  { size: "large" },
);

const variables = computed(() => {
  const tokens = resolveThemeTokens(props.theme);
  return {
    "--layout-preview-primary": tokens.primary,
    "--layout-preview-accent": tokens.accent,
    "--layout-preview-background": tokens.background,
    "--layout-preview-surface": tokens.surface,
    "--layout-preview-text": tokens.text,
    "--layout-preview-radius": tokens.radius,
  };
});
</script>

<template>
  <div
    class="layout-diagram"
    :class="[`layout-diagram--${layout}`, `layout-diagram--${size}`]"
    :style="variables"
    aria-hidden="true"
  >
    <div class="layout-diagram__topbar"><span></span><span></span></div>
    <div class="layout-diagram__body">
      <div v-if="layout === 'two-column'" class="layout-diagram__sidebar">
        <span></span><span></span><span></span>
      </div>
      <div class="layout-diagram__content">
        <div class="layout-diagram__intro">
          <span></span><span></span><span></span>
        </div>
        <div class="layout-diagram__regions">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>
