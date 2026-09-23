<script setup lang="ts">
import { computed } from "vue";
import type { GeneratorCatalog, ProjectConfig } from "@project-forge/contracts";
import { uiLayoutDescriptions, uiLayoutLabels } from "../domain/ui-layouts";
import LayoutChoiceField from "../components/LayoutChoiceField.vue";
import LayoutPreview from "../components/LayoutPreview.vue";

const props = defineProps<{
  config: ProjectConfig;
  catalog: GeneratorCatalog;
}>();
const emit = defineEmits<{ change: [path: string, value: string] }>();
const frontendUnavailable = computed(
  () => props.config.stack.frontend !== "vue-vite",
);
const selectedLabel = computed(() => uiLayoutLabels[props.config.ui.layout]);
</script>

<template>
  <section aria-labelledby="ui-layout-heading">
    <h2 id="ui-layout-heading" tabindex="-1">UI Layout</h2>
    <p class="step-description">
      Choose how the main content is arranged in your generated app.
    </p>
    <p
      v-if="frontendUnavailable"
      id="layout-unavailable-note"
      class="layout-unavailable"
      role="note"
    >
      A Vue frontend is required for these layouts. Your current selection will
      be kept and restored if you choose Vue again.
    </p>
    <LayoutChoiceField
      :model-value="config.ui.layout"
      :choices="catalog.uiLayouts"
      :theme="config.theme"
      :disabled="frontendUnavailable"
      @update:model-value="emit('change', 'ui.layout', $event)"
    />
    <figure class="layout-preview-figure">
      <div class="layout-preview-figure__header">
        <h3>Live preview</h3>
        <span>{{ selectedLabel }}</span>
      </div>
      <LayoutPreview
        :layout="config.ui.layout"
        :theme="config.theme"
        size="large"
      />
      <figcaption>
        {{ selectedLabel }} structure preview.
        {{ uiLayoutDescriptions[config.ui.layout] }} Theme colors update this
        preview too.
      </figcaption>
    </figure>
  </section>
</template>
