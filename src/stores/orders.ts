import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invokeSafe } from '@/utils/ipc'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<any[]>([])
  const stats = ref({ count: 0, revenue: 0, avg_order: 0 })
  const total = ref(0)
  const loading = ref(false)

  async function load(filters: any) {
    loading.value = true
    const res = await invokeSafe<any>('orders:listExtended', filters)
    loading.value = false
    if (res.ok) {
      orders.value = res.data.orders || []
      total.value = res.data.total || 0
      stats.value = res.data.stats || { count: 0, revenue: 0, avg_order: 0 }
    }
  }

  async function getFull(id: number) {
    const res = await invokeSafe('orders:get', id)
    return res.ok ? res.data : null
  }

  async function voidOrder(orderId: number, reason: string) {
    return invokeSafe('orders:void', { orderId, reason })
  }

  async function restoreOrder(orderId: number) {
    return invokeSafe('orders:restore', orderId)
  }

  return { orders, stats, total, loading, load, getFull, voidOrder, restoreOrder }
})
