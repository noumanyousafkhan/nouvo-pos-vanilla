import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDealsStore = defineStore('deals', () => {
  const deals = ref<any[]>([])
  const loading = ref(false)

  async function loadDeals(includeInactive = false, onlyValid = true) {
    loading.value = true
    const res = await (window as any).nouvo.invoke('deals:list', includeInactive, onlyValid)
    if (res?.ok) deals.value = res.data
    loading.value = false
  }

  async function expandToCart(dealId: number) {
    const res = await (window as any).nouvo.invoke('deals:expandToCart', dealId)
    return res?.ok ? res.data : []
  }

  return { deals, loading, loadDeals, expandToCart }
})
