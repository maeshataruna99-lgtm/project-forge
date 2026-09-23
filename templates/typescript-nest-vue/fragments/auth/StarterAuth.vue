<script setup lang="ts">
import { computed, ref } from 'vue';

type TokenPair = { accessToken: string; refreshToken: string; expiresIn: number };
type NavigationItem = { key: string; label: string; href: string };

const mode = ref<'register' | 'login'>('register');
const companyName = ref('');
const email = ref('');
const password = ref('');
const companyId = ref('');
const accessToken = ref('');
const navigation = ref<NavigationItem[]>([]);
const error = ref('');
const busy = ref(false);
const signedIn = computed(() => accessToken.value.length > 0);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const path = mode.value === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode.value === 'register'
      ? { companyName: companyName.value, email: email.value, password: password.value }
      : { email: email.value, password: password.value, ...(companyId.value ? { companyId: companyId.value } : {}) };
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json() as TokenPair & { message?: string };
    if (!response.ok || !result.accessToken) throw new Error(result.message ?? 'Authentication failed');
    accessToken.value = result.accessToken;
    /*__NAVIGATION_FETCH__*/
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Authentication failed';
  } finally {
    busy.value = false;
  }
}

function signOut() {
  accessToken.value = '';
  navigation.value = [];
  password.value = '';
}
</script>

<template>
  <section class="auth-card" aria-labelledby="auth-title">
    <h2 id="auth-title">{{ signedIn ? 'Signed in' : mode === 'register' ? 'Create your company account' : 'Sign in' }}</h2>
    <form v-if="!signedIn" @submit.prevent="submit">
      <label v-if="mode === 'register'">Company name<input v-model="companyName" name="companyName" required minlength="2" maxlength="100" /></label>
      <label>Email<input v-model="email" name="email" type="email" required maxlength="254" autocomplete="username" /></label>
      <label>Password<input v-model="password" name="password" type="password" required minlength="12" maxlength="128" autocomplete="current-password" /></label>
      <label v-if="mode === 'login'">Company ID (only when you belong to multiple companies)<input v-model="companyId" name="companyId" /></label>
      <p v-if="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="busy">{{ busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in' }}</button>
      <button type="button" class="quiet" @click="mode = mode === 'register' ? 'login' : 'register'">
        {{ mode === 'register' ? 'Already registered? Sign in' : 'Need an account? Register' }}
      </button>
    </form>
    <div v-else>
      <p>Your access token stays in memory and is cleared when you sign out or close this page.</p>
      <!--__NAVIGATION_ITEMS__-->
      <button type="button" @click="signOut">Sign out</button>
    </div>
  </section>
</template>

<style scoped>
.auth-card { margin-top: 28px; padding: 24px; border: 1px solid color-mix(in srgb, var(--primary), transparent 65%); border-radius: 16px; background: var(--surface); color: var(--text); }
form { display: grid; gap: 14px; max-width: 420px; }
label { display: grid; gap: 6px; font-weight: 600; }
input { min-height: 42px; padding: 8px 10px; border: 1px solid #94a3b8; border-radius: 8px; font: inherit; }
button { min-height: 42px; padding: 8px 12px; border: 0; border-radius: 8px; background: var(--primary); color: white; cursor: pointer; font: inherit; }
button:disabled { opacity: .65; cursor: wait; }
.quiet { background: transparent; color: var(--primary); text-align: left; }
nav { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
nav a { color: var(--primary); }
</style>
