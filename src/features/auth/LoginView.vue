<template>
  <div class="login-root">
    <div class="login-card">
      <div class="logo-wrap">
        <NouvoLogo variant="full" :size="120" />
      </div>

      <div class="brand-text">
        <h1 class="product-name">NOUVO POS</h1>
        <p class="product-sub">VANILLA</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="Enter username"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter password"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="error" class="alert alert--error">{{ error }}</div>

        <button type="submit" class="btn btn--primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="version">v0.1.0</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NouvoLogo from '@/components/brand/NouvoLogo.vue'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const result = await auth.login(username.value, password.value)
    if (result.ok) {
      router.push('/home')
    } else {
      error.value = result.error || 'Login failed'
    }
  } catch (err: any) {
    error.value = err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 24px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
  border: 1px solid #E0DAD0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-wrap {
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 32px;
}

.product-name {
  font-size: 24px;
  font-weight: 700;
  color: #1B4D3E;
  margin: 0;
  letter-spacing: 1.5px;
}

.product-sub {
  font-size: 11px;
  font-weight: 500;
  color: #7BA88C;
  margin: 0;
  letter-spacing: 4px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #4A4A4A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid #E0DAD0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #FFFFFF;
}

.form-input:focus {
  border-color: #025726;
  box-shadow: 0 0 0 3px rgba(2, 87, 38, 0.12);
}

.btn {
  padding: 14px 20px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  margin-top: 8px;
}

.btn--primary {
  background: #025726;
  color: #FFFFFF;
}

.btn--primary:hover:not(:disabled) {
  background: #014020;
  transform: translateY(-1px);
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
}

.alert--error {
  background: #FCEAEA;
  color: #8B1E1E;
  border-left: 4px solid #E85A5A;
}

.version {
  font-size: 11px;
  color: #8A8A8A;
  margin-top: 24px;
  margin-bottom: 0;
}
</style>
