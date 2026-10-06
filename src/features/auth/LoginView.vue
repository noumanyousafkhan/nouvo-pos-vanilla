<template>
  <AuthLayout>
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-nouvo-green">NOUVO POS</h1>
      <p class="text-xs tracking-[4px] text-nouvo-green-light mt-1">VANILLA</p>
      <p class="text-sm text-nouvo-gray mt-4">Welcome back</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <NInput
        v-model="username"
        label="Username"
        placeholder="Enter username"
        autocomplete="username"
      />

      <NInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="Enter password"
        autocomplete="current-password"
        password-toggle
        @enter="handleLogin"
      />

      <NError :message="error" />

      <NButton type="submit" :loading="loading" full size="lg">
        {{ loading ? 'Logging in...' : 'Login' }}
      </NButton>
    </form>

    <p class="text-center text-[11px] text-nouvo-gray-light mt-6">v0.1.0</p>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import NInput from '@/components/ui/NInput.vue'
import NButton from '@/components/ui/NButton.vue'
import NError from '@/components/ui/NError.vue'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }
  loading.value = true
  error.value = ''

  const res = await auth.login(username.value, password.value)
  loading.value = false

  if (res.ok) {
    router.push('/home')
  } else {
    error.value = res.error || 'Login failed'
  }
}
</script>
