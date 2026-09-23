<script setup lang="ts">
const props = defineProps<{ steps: readonly string[]; current: number }>();
const emit = defineEmits<{ navigate: [index: number] }>();
function navigate(index: number) {
  if (index < props.current) emit('navigate', index);
}
</script>

<template>
  <nav aria-label="Wizard steps" class="stepper">
    <ol>
      <li v-for="(step, index) in steps" :key="step">
        <button type="button" :aria-label="`Go to ${step}`" :aria-current="index === current ? 'step' : undefined" :disabled="index >= current" @click="navigate(index)">
          <span class="step-number">{{ index + 1 }}</span><span>{{ step }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>
