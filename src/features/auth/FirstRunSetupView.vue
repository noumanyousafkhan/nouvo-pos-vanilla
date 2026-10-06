<template>
  <AuthLayout>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-nouvo-green">Welcome to NOUVO POS</h1>
      <p class="text-sm text-nouvo-gray mt-1">Create your Super Admin account</p>
    </div>

    <form @submit.prevent="handleSetup" class="space-y-4">
      <NInput
        v-model="username"
        label="Username"
        placeholder="Enter username"
        autocomplete="username"
        required
      />

      <NInput
        v-model="password"
        label="Password"
        hint="Min 8 chars, 1 letter, 1 number"
        type="password"
        placeholder="Enter password"
        autocomplete="new-password"
        password-toggle
        required
      />

      <NInput
        v-model="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Re-enter password"
        autocomplete="new-password"
        password-toggle
        required
      />

      <NError :message="error" />

      <NButton type="submit" :loading="loading" full size="lg">
        {{ loading ? 'Creating...' : 'Create Super Admin' }}
      </NButton>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import NInput from '@/components/ui/NInput.vue'
import NButton from '@/components/ui/NButton.vue'
import NError from '@/components/ui/NError.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleSetup() {
  error.value = ''

  if (username.value.length < 3) {
    error.value = 'Username must be at least 3 characters'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  if (!/[a-zA-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    error.value = 'Password must contain at least 1 letter and 1 number'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  const res = await (window as any).nouvo.invoke(
    'auth:createInitialAdmin',
    username.value,
    password.value
  )
  loading.value = false

  if (res?.ok) {
    router.push('/login')
  } else {
    error.value = res?.error?.message || 'Setup failed'
  }
}
</script>
