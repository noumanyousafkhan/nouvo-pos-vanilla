import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invokeSafe } from '@/utils/ipc'

export const useReportsStore = defineStore('reports', () => {
  const data = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(filters: any) {
    loading.value = true
    error.value = null
    try {
      const res = await invokeSafe<any>('reports:fullDashboard', filters)
      if (res.ok) {
        // Only replace data when we have new data — never set to null
        data.value = res.data
      } else {
        error.value = res.error?.message || 'Failed to load reports'
      }
    } catch (err: any) {
      error.value = err?.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
})
