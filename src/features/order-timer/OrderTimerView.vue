<template>
  <div class="h-screen flex flex-col bg-nouvo-cream overflow-hidden">
    <header class="h-16 bg-nouvo-green text-white flex items-center justify-between px-6 shrink-0">
      <!-- Left: Business logo + name -->
      <div class="flex items-center gap-3 shrink-0">
        <img
          v-if="settingsStore.business.logo_path"
          :src="fileUrl(settingsStore.business.logo_path)"
          alt="Logo"
          class="h-10 w-10 object-contain shrink-0"
        />
        <div v-else class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
          {{ businessInitial }}
        </div>
        <div class="leading-tight">
          <div class="font-bold tracking-wide text-[14px]">{{ settingsStore.businessName }}</div>
          <div class="text-[10px] text-white/60">{{ settingsStore.business.slogan || 'NOUVO POS' }}</div>
        </div>
      </div>

      <!-- Center: Nav tabs -->
      <nav class="flex items-center gap-1 flex-1 justify-center">
        <button
          v-for="tab in navTabs"
          :key="tab.path"
          type="button"
          class="cursor-pointer px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          :class="$route.path === tab.path ? 'bg-nouvo-cream text-nouvo-green' : 'text-white/80 hover:bg-white/10 hover:text-white'"
          @click="navigate(tab)"
        >{{ tab.label }}</button>
      </nav>

      <!-- Right: User + Logout -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right leading-tight">
          <div class="text-[12px] font-bold">{{ userName }}</div>
          <div class="text-[10px] text-white/60">{{ userRole }}</div>
        </div>
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold text-[13px]">
          {{ userInitial }}
        </div>
        <button
          type="button"
          class="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg text-[12px] font-medium transition-colors"
          @click="logout"
        >Logout</button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-6 py-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-nouvo-green">Order Timer</h1>
        <div class="text-sm text-nouvo-gray">
          Prep time: <span class="font-bold text-nouvo-ink">{{ prepTimeMinutes }} min</span>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-nouvo-gray">
        Loading...
      </div>

      <div v-else-if="activeOrders.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-xl font-bold text-nouvo-green mb-2">All caught up!</h2>
        <p class="text-sm text-nouvo-gray">No active orders in the kitchen.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <OrderTimerCard
          v-for="order in activeOrders"
          :key="order.id"
          :order="order"
          :now="now"
          :prep-time-minutes="prepTimeMinutes"
          @complete="markCompleted"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'
import OrderTimerCard from './OrderTimerCard.vue'

const router = useRouter()
const auth = useAuthStore()
const settingsStore = useSettingsStore()

const userName = computed(() => auth.user?.username ?? 'User')
const userRole = computed(() => auth.user?.role ?? 'Cashier')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const businessInitial = computed(() => (settingsStore.businessName?.[0] ?? 'N').toUpperCase())

const navTabs = [
  { label: 'Home', path: '/home' },
  { label: 'Menu', path: '/menu' },
  { label: 'Orders', path: '/orders' },
  { label: 'Reports', path: '/reports' },
  { label: '⏱ Order Timer', path: '/order-timer' },
  { label: 'Settings', path: '/settings' }
]

const activeOrders = ref<any[]>([])
const loading = ref(true)
const now = ref(Date.now())
const prepTimeMinutes = ref(40)

let nowInterval: ReturnType<typeof setInterval> | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = String(p).replace(/\\/g, '/')
  return `nouvo-file://${normalized}`
}

function navigate(tab: { path: string }) {
  router.push(tab.path)
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

async function loadActiveOrders() {
  try {
    const res = await invokeSafe<any>('orders:listActive')
    if (res.ok && Array.isArray(res.data)) {
      activeOrders.value = res.data
    } else {
      activeOrders.value = []
    }
  } catch (err) {
    console.error('Failed to load active orders:', err)
    activeOrders.value = []
  } finally {
    loading.value = false
  }
}

async function loadPrepTime() {
  try {
    const res = await invokeSafe<any>('settings:getOrder')
    if (res.ok && res.data?.prep_time_minutes) {
      prepTimeMinutes.value = res.data.prep_time_minutes
    }
  } catch {}
}

async function markCompleted(orderId: number) {
  try {
    const res = await invokeSafe<any>('orders:markCompleted', orderId)
    if (res.ok) {
      await loadActiveOrders()
    }
  } catch (err) {
    console.error('Failed to mark complete:', err)
  }
}

onMounted(async () => {
  await loadPrepTime()
  await loadActiveOrders()
  nowInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  refreshInterval = setInterval(() => {
    loadActiveOrders()
  }, 30000)
})

onUnmounted(() => {
  if (nowInterval) clearInterval(nowInterval)
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>
