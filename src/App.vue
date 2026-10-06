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
  // Then load settings
  await settings.loadAll()
})
</script>
