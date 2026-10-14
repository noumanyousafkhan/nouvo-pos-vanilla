<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'

const settings = useSettingsStore()
const auth = useAuthStore()

onMounted(async () => {
  // Restore session first (sync from localStorage)
  await auth.restoreSession()
  // Load protected settings only after the main process validates a session.
  if (auth.isAuthenticated) await settings.loadAll()
})
</script>
