<script setup lang="ts">
type UiLayout =
  | "single-column"
  | "two-column"
  | "grid"
  | "split-screen"
  | "magazine"
  | "hero-landing";

defineProps<{
  layout: UiLayout;
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="layout-app" :class="`layout-app--${layout}`">
    <header class="layout-topbar">
      <span class="layout-brand">Project Forge</span>
      <span class="layout-topbar-note">Starter workspace</span>
    </header>

    <div v-if="layout === 'two-column'" class="layout-workspace">
      <aside class="layout-sidebar">
        <p class="layout-sidebar-title">{{ title }}</p>
        <nav aria-label="Workspace navigation">
          <a href="#workspace-main" aria-current="page">Overview</a>
          <a href="#workspace-support">Getting started</a>
        </nav>
        <slot name="aside" />
      </aside>
      <main
        id="workspace-main"
        class="layout-content layout-content--two-column"
      >
        <header class="layout-intro">
          <p class="layout-eyebrow">{{ eyebrow }}</p>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
          <slot name="actions" />
        </header>
        <div class="layout-panels">
          <section class="layout-primary"><slot name="main" /></section>
          <aside id="workspace-support" class="layout-secondary">
            <slot name="support" />
          </aside>
        </div>
      </main>
    </div>

    <main v-else class="layout-content" :class="`layout-content--${layout}`">
      <header class="layout-intro">
        <p class="layout-eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <slot name="actions" />
      </header>
      <div class="layout-panels">
        <section class="layout-primary"><slot name="main" /></section>
        <aside id="workspace-support" class="layout-secondary">
          <slot name="support" />
        </aside>
      </div>
    </main>
  </div>
</template>
