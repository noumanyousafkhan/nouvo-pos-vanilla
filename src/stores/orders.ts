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
    const res = await invokeSafe<any>('orders:list', filters)
    loading.value = false
    if (res.ok && res.data) {
      orders.value = res.data.orders || []
      total.value = res.data.total || 0
      stats.value = res.data.stats || { count: 0, revenue: 0, avg_order: 0 }
    } else {
      orders.value = []
      total.value = 0
      stats.value = { count: 0, revenue: 0, avg_order: 0 }
      console.error('Orders load failed:', (res as any).error?.message)
    }
  }

  async function getFull(id: number) {
    const res = await invokeSafe<any>('orders:get', id)
    return res.ok ? res.data : null
  }

  async function voidOrder(orderId: number, reason: string, userId?: number, role?: string) {
    const res = await invokeSafe('orders:void', { orderId, reason }, userId, role)
    return res
  }

  async function restoreOrder(orderId: number) {
    const res = await invokeSafe('orders:restore', orderId)
    return res
  }

  return { orders, stats, total, loading, load, getFull, voidOrder, restoreOrder }
})
