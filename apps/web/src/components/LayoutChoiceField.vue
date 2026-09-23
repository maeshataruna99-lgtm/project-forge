<script setup lang="ts">
import type {
  GeneratorCatalog,
  ProjectConfig,
  UiLayout,
} from "@project-forge/contracts";
import { uiLayoutDescriptions } from "../domain/ui-layouts";
import LayoutPreview from "./LayoutPreview.vue";

defineProps<{
  modelValue: UiLayout;
  choices: GeneratorCatalog["uiLayouts"];
  theme: ProjectConfig["theme"];
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: UiLayout] }>();

function select(value: string, available: boolean, disabled: boolean) {
  if (!available || disabled) return;
  emit("update:modelValue", value as UiLayout);
}
</script>

<template>
  <fieldset
    class="layout-choice-field"
    :aria-describedby="
      disabled
        ? 'layout-choice-help layout-unavailable-note'
        : 'layout-choice-help'
    "
  >
    <legend>Choose a page structure</legend>
    <p id="layout-choice-help" class="field-help">
      Select a layout to shape the generated Vue application.
    </p>
    <div class="layout-choice-grid">
      <label
        v-for="choice in choices"
        :key="choice.value"
        class="layout-choice-card"
        :class="{
          'layout-choice-card--selected': modelValue === choice.value,
          'layout-choice-card--disabled': disabled || !choice.available,
        }"
      >
        <input
          type="radio"
          name="ui-layout"
          :value="choice.value"
          :checked="modelValue === choice.value"
          :disabled="disabled || !choice.available"
          @change="select(choice.value, choice.available, !!disabled)"
        />
        <span class="layout-choice-card__header">
          <span class="layout-choice-card__title">{{ choice.label }}</span>
          <span
            v-if="modelValue === choice.value"
            class="layout-choice-card__selected"
            >Selected</span
          >
        </span>
        <LayoutPreview
          :layout="choice.value as UiLayout"
          :theme="theme"
          size="card"
        />
        <span class="layout-choice-card__description">{{
          uiLayoutDescriptions[choice.value as UiLayout]
        }}</span>
        <span v-if="!choice.available" class="layout-choice-card__reason">{{
          choice.reason
        }}</span>
      </label>
    </div>
  </fieldset>
</template>
