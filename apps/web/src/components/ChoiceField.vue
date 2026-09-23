<script setup lang="ts">
import type { GeneratorCatalog } from '@project-forge/contracts';

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  choices: GeneratorCatalog['profiles'];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function choose(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (props.choices.some(choice => choice.value === select.value && choice.available)) emit('update:modelValue', select.value);
  else select.value = props.modelValue;
}
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <select :id="id" :value="modelValue" :aria-describedby="choices.some(choice => !choice.available) ? `${id}-reasons` : undefined" @change="choose">
      <option v-for="choice in choices" :key="choice.value" :value="choice.value" :disabled="!choice.available">{{ choice.label }}</option>
    </select>
    <ul v-if="choices.some(choice => !choice.available)" :id="`${id}-reasons`" class="choice-reasons">
      <li v-for="choice in choices.filter(item => !item.available)" :key="choice.value">{{ choice.label }}: {{ choice.reason }}</li>
    </ul>
  </div>
</template>
