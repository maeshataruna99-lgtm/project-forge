<script setup lang="ts">
import { ref } from "vue";
import StarterLayout from "./components/StarterLayout.vue";

type DemoItem = { id: number; title: string };
const storageKey = "__PROJECT_NAME__:demo-items";
const notice = ref(
  "Demo data is saved only in this browser. Do not enter sensitive information.",
);
const title = ref("");
const items = ref<DemoItem[]>([]);
try {
  items.value = JSON.parse(
    localStorage.getItem(storageKey) ?? "[]",
  ) as DemoItem[];
  if (!Array.isArray(items.value)) items.value = [];
} catch {
  notice.value =
    "Browser storage is unavailable. Items will stay in this page only.";
}

function addItem() {
  const value = title.value.trim();
  if (!value) return;
  items.value = [...items.value, { id: Date.now(), title: value }];
  title.value = "";
  try {
    localStorage.setItem(storageKey, JSON.stringify(items.value));
  } catch {
    notice.value =
      "Browser storage is unavailable. Items will stay in this page only.";
  }
}

function removeItem(id: number) {
  items.value = items.value.filter((item) => item.id !== id);
  try {
    localStorage.setItem(storageKey, JSON.stringify(items.value));
  } catch {
    notice.value =
      "Browser storage is unavailable. Items will stay in this page only.";
  }
}
</script>

<template>
  <StarterLayout
    layout="__UI_LAYOUT__"
    eyebrow="Project Forge demo"
    title="__PROJECT_NAME__"
    description="Try a small interface and see how your selected layout organizes it."
  >
    <template #actions>
      <a class="layout-action" href="#demo-title">Add your first item</a>
    </template>
    <template #main>
      <form class="card demo-form" @submit.prevent="addItem">
        <label for="demo-title">Add a sample item</label>
        <input id="demo-title" v-model="title" maxlength="120" />
        <button type="submit">Add item</button>
      </form>
      <ul class="demo-items">
        <li v-for="item in items" :key="item.id">
          {{ item.title }}
          <button type="button" @click="removeItem(item.id)">Remove</button>
        </li>
      </ul>
    </template>
    <template #support>
      <p class="demo-data-notice" role="note">{{ notice }}</p>
    </template>
  </StarterLayout>
</template>
