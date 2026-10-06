import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invokeSafe } from '@/utils/ipc'

export const useMenuStore = defineStore('menu', () => {
  const categories = ref<any[]>([])
  const products = ref<any[]>([])
  const loading = ref(false)
  const lastUpdate = ref<number>(Date.now())

  async function loadCategories(includeInactive = true) {
    loading.value = true
    const res = await invokeSafe<any>('menu:categories:list', includeInactive)
    if (res.ok) categories.value = res.data || []
    loading.value = false
  }

  async function loadProducts(categoryId?: number | null, includeInactive = false) {
    const res = await invokeSafe<any>('menu:products:list', categoryId ?? null, includeInactive)
    if (res.ok) products.value = res.data || []
  }

  function notifyUpdate() {
    lastUpdate.value = Date.now()
  }

  return { categories, products, loading, lastUpdate, loadCategories, loadProducts, notifyUpdate }
})
