<script setup lang="ts">
defineProps<{ files: string[] }>();
</script>

<template>
  <section aria-labelledby="file-tree-heading" class="file-tree">
    <h3 id="file-tree-heading">Generated files</h3>
    <ul aria-label="Generated file tree">
      <li v-for="file in files" :key="file"><code>{{ file }}</code></li>
    </ul>
  </section>
</template>
