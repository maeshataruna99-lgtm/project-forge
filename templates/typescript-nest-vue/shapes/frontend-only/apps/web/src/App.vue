<script setup lang="ts">
import { ref } from 'vue';

type DemoItem = { id: number; title: string };
const storageKey = '__PROJECT_NAME__:demo-items';
const notice = ref('Demo data is saved only in this browser. Do not enter sensitive information.');
const title = ref('');
const items = ref<DemoItem[]>([]);
try {
  items.value = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as DemoItem[];
  if (!Array.isArray(items.value)) items.value = [];
} catch {
  notice.value = 'Browser storage is unavailable. Items will stay in this page only.';
}

function addItem() {
  const value = title.value.trim();
  if (!value) return;
  items.value = [...items.value, { id: Date.now(), title: value }];
  title.value = '';
  try { localStorage.setItem(storageKey, JSON.stringify(items.value)); }
  catch { notice.value = 'Browser storage is unavailable. Items will stay in this page only.'; }
}

function removeItem(id: number) {
  items.value = items.value.filter(item => item.id !== id);
  try { localStorage.setItem(storageKey, JSON.stringify(items.value)); }
  catch { notice.value = 'Browser storage is unavailable. Items will stay in this page only.'; }
}
</script>

<template>
  <main class="shell">
    <div class="badge">Project Forge demo</div>
    <h1>__PROJECT_NAME__</h1>
    <p>{{ notice }}</p>
    <form @submit.prevent="addItem">
      <label for="demo-title">Add a sample item</label>
      <input id="demo-title" v-model="title" maxlength="120" />
      <button type="submit">Add item</button>
    </form>
    <ul><li v-for="item in items" :key="item.id">{{ item.title }} <button type="button" @click="removeItem(item.id)">Remove</button></li></ul>
  </main>
</template>
