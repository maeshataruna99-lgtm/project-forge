<script setup lang="ts">
import { onMounted, ref } from "vue";
import StarterLayout from "./components/StarterLayout.vue";
/*__AUTH_FRONTEND_IMPORT__*/
type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  category: string;
};
const products = ref<Product[]>([]);
const status = ref("Loading sample products…");
/*__AUTH_FRONTEND_SETUP__*/
onMounted(async () => {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Products are unavailable.");
    products.value = (await response.json()) as Product[];
    status.value =
      "Sample catalog data is in memory and resets when the API restarts.";
  } catch {
    status.value =
      "Products are unavailable. Start the API and reload this page.";
  }
});
</script>

<template>
  <StarterLayout
    layout="__UI_LAYOUT__"
    eyebrow="E-commerce starter"
    title="__PROJECT_NAME__"
    description="A ready-to-extend product catalog workspace."
  >
    <template #actions>
      <a class="layout-action" href="#product-catalog">Browse sample catalog</a>
    </template>
    <template #main>
      <p role="status">{{ status }}</p>
      <section
        id="product-catalog"
        class="product-grid"
        aria-label="Sample products"
      >
        <article
          v-for="product in products"
          :key="product.id"
          class="card product-card"
        >
          <p class="product-category">{{ product.category }}</p>
          <h2>{{ product.name }}</h2>
          <p>{{ product.description }}</p>
          <strong>{{
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: product.currency,
            }).format(product.priceCents / 100)
          }}</strong>
        </article>
      </section>
    </template>
    <template #support>
      <section class="card starter-note">
        <h2>Starter scope</h2>
        <p>
          This is a catalog scaffold, not a checkout, payment, inventory, or
          order system.
        </p>
      </section>
      <!--__AUTH_FRONTEND_UI__-->
    </template>
  </StarterLayout>
</template>
