<template>
  <div class="h-screen flex flex-col bg-nouvo-cream overflow-hidden">
    <!-- Top Bar -->
    <header class="h-16 bg-nouvo-green text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3 shrink-0">
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold">
          N
        </div>
        <span class="font-bold tracking-wide text-[14px]">NOUVO POS</span>
      </div>

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

    <!-- Content -->
    <div class="flex-1 flex flex-col p-6 overflow-hidden">
      <header class="flex items-center justify-between mb-4 shrink-0">
        <h1 class="text-xl font-bold text-nouvo-green">Settings</h1>
      </header>

      <nav class="flex gap-2 mb-4 shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'cursor-pointer px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border-2',
            activeTab === tab.id
              ? 'bg-nouvo-green text-white border-nouvo-green'
              : 'bg-white text-nouvo-ink border-nouvo-green/30 hover:border-nouvo-green'
          ]"
          @click="activeTab = tab.id"
        >{{ tab.label }}</button>
      </nav>

      <main class="flex-1 overflow-y-auto bg-white rounded-2xl border-2 border-nouvo-green/30 p-6">
        <BusinessTab v-if="activeTab === 'business'" />
        <ReceiptTab v-else-if="activeTab === 'receipt'" />
        <PrinterTab v-else-if="activeTab === 'printer'" />
        <OrdersTab v-else-if="activeTab === 'orders'" />
        <SystemTab v-else-if="activeTab === 'system'" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BusinessTab from './tabs/BusinessTab.vue'
import ReceiptTab from './tabs/ReceiptTab.vue'
import PrinterTab from './tabs/PrinterTab.vue'
import OrdersTab from './tabs/OrdersTab.vue'
import SystemTab from './tabs/SystemTab.vue'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('business')
const tabs = [
  { id: 'business', label: 'Business' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'printer', label: 'Printer' },
  { id: 'orders', label: 'Orders' },
  { id: 'system', label: 'System' }
]

const userName = computed(() => auth.user?.username ?? 'User')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const navTabs = [
  { path: '/home', label: 'Dashboard', query: {} },
  { path: '/orders', label: 'Orders', query: {} },
  { path: '/menu', label: 'Menu', query: {} },
  { path: '/reports', label: 'Reports', query: { from: 'dashboard' } },
  { path: '/settings', label: 'Settings', query: {} }
]

function navigate(tab: any) {
  router.push({ path: tab.path, query: tab.query })
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>
