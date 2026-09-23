<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { HealthResponse } from "@__PROJECT_NAME__/contracts";
import StarterLayout from "./components/StarterLayout.vue";
/*__AUTH_FRONTEND_IMPORT__*/

const apiStatus = ref("Checking API…");
/*__AUTH_FRONTEND_SETUP__*/
onMounted(async () => {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("API unavailable");
    const health: HealthResponse = await response.json();
    apiStatus.value = health.status === "ok" ? "API online" : "API unavailable";
  } catch {
    apiStatus.value = "API unavailable";
  }
});
</script>

<template>
  <StarterLayout
    layout="__UI_LAYOUT__"
    eyebrow="Project Forge starter"
    title="__PROJECT_NAME__"
    description="Your __PROFILE_LABEL__ NestJS and Vue application is ready to extend."
  >
    <template #actions>
      <a class="layout-action" href="#starter-next-steps">Explore next steps</a>
    </template>
    <template #main>
      <p role="status">
        {{ apiStatus }}. Connect your next feature to the Prisma models.
      </p>
      <section id="starter-next-steps" class="card">
        <h2>Start here</h2>
        <p>Build your workspace one feature at a time.</p>
        <a href="http://localhost:3000/health" target="_blank" rel="noreferrer"
          >Open API health</a
        >
      </section>
    </template>
    <template #support>
      <section class="card">
        <h2>Next steps</h2>
        <ul>
          <li>Extend the API with your domain.</li>
          <li>Connect the interface to your data.</li>
          <li>Keep your setup guide up to date.</li>
        </ul>
      </section>
      <!--__AUTH_FRONTEND_UI__-->
    </template>
  </StarterLayout>
</template>
