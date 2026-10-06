import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCheckoutStore = defineStore('checkout', () => {
  const lastOrder = ref<any>(null)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  async function createOrder(payload: any) {
    submitting.value = true
    error.value = null
    const res = await (window as any).nouvo.invoke('orders:create', payload)
    submitting.value = false
    if (res?.ok) {
      lastOrder.value = res.data
      return res.data
    } else {
      error.value = res?.error?.message || 'Order failed'
      throw new Error(error.value || 'Order failed')
    }
  }

  function reset() {
    lastOrder.value = null
    submitting.value = false
    error.value = null
  }

  return { lastOrder, submitting, error, createOrder, reset }
})
