<template>
  <div class="h-screen bg-nouvo-cream flex flex-col overflow-hidden">
    <PosTopBar />

    <div class="flex-1 overflow-y-auto px-6 lg:px-8 pb-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-2xl font-bold text-nouvo-green">Order Timer</h1>
        <div class="flex items-center gap-4 text-[12px]">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-white border border-nouvo-gray-border"></span>
            <span class="text-nouvo-gray">Normal</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></span>
            <span class="text-nouvo-gray">≤ 10 min</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span>
            <span class="text-nouvo-gray">≤ 5 min</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            <span class="text-nouvo-gray">Delayed</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && orders.length === 0" class="text-center text-nouvo-gray py-16 text-sm">
        Loading orders...
      </div>

      <!-- Empty states -->
      <div v-else-if="orders.length === 0" class="flex-1 flex flex-col items-center justify-center py-20">
        <div class="text-6xl opacity-30 mb-4">⏱️</div>
        <div class="text-lg font-bold text-nouvo-green mb-1">All caught up!</div>
        <div class="text-sm text-nouvo-gray">There are no active orders right now.</div>
      </div>

      <!-- Grid — 3 cards per row -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <OrderTimerCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          :now="now"
          :prep-time-minutes="prepTimeMinutes"
          @complete="onComplete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import PosTopBar from '@/features/pos/components/PosTopBar.vue'
import OrderTimerCard from './OrderTimerCard.vue'
import { invokeSafe } from '@/utils/ipc'

const orders = ref<any[]>([])
const loading = ref(false)
const now = ref(Date.now())
const prepTimeMinutes = ref(40)

let tickInterval: any = null
let pollInterval: any = null

async function loadOrders() {
  loading.value = true
  const res = await invokeSafe<any>('orders:listActive')
  loading.value = false
  if (res.ok && res.data) {
    orders.value = res.data
  }
}

async function loadSettings() {
  const res = await invokeSafe<any>('settings:getOrder')
  if (res.ok && res.data) {
    prepTimeMinutes.value = Number(res.data.prep_time_minutes) || 40
  }
}

async function onComplete(orderId: number) {
  const res = await invokeSafe<any>('orders:markCompleted', orderId)
  if (res.ok) {
    orders.value = orders.value.filter((o) => o.id !== orderId)
  } else {
    alert('Failed: ' + ((res as any).error?.message || 'Unknown'))
  }
}

onMounted(async () => {
  await loadSettings()
  await loadOrders()

  // Tick every 1 second — update `now`
  tickInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  // Poll every 3 seconds for new orders
  pollInterval = setInterval(() => {
    loadOrders()
  }, 3000)
})

onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval)
  if (pollInterval) clearInterval(pollInterval)
})
</script>
