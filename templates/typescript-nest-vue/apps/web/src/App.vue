<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { HealthResponse } from '@__PROJECT_NAME__/contracts';

const apiStatus = ref('Checking API…');
onMounted(async () => {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('API unavailable');
    const health: HealthResponse = await response.json();
    apiStatus.value = health.status === 'ok' ? 'API online' : 'API unavailable';
  } catch {
    apiStatus.value = 'API unavailable';
  }
});
</script>

<template>
  <main class="shell">
    <div class="badge">Project Forge starter</div>
    <h1>__PROJECT_NAME__</h1>
    <p>Your minimal NestJS and Vue application is ready to extend.</p>
    <div class="card">
      <h2>Start here</h2>
      <p>{{ apiStatus }}. Connect your next feature to the Prisma models.</p>
      <a href="http://localhost:3000/health" target="_blank" rel="noreferrer">Open API health</a>
    </div>
  </main>
</template>
