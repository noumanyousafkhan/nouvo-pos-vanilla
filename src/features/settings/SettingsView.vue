<template>
  <div class="h-screen flex flex-col bg-nouvo-cream overflow-hidden">
    <header class="h-16 bg-nouvo-green text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3 shrink-0">
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold">N</div>
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

    <div class="flex-1 grid grid-cols-[260px_1fr] gap-6 px-6 py-6 overflow-hidden">
      <aside class="bg-white rounded-2xl border-2 border-nouvo-green/20 p-4 overflow-y-auto">
        <h2 class="text-xs font-bold text-nouvo-gray uppercase tracking-wider mb-3">Settings</h2>
        <ul class="space-y-1">
          <li v-for="tab in tabs" :key="tab.id"
            class="cursor-pointer flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium"
            :class="activeTab === tab.id ? 'bg-nouvo-green text-white' : 'hover:bg-nouvo-cream text-nouvo-ink'"
            @click="activeTab = tab.id">
            <span class="text-base">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </li>
        </ul>
      </aside>

      <main class="bg-white rounded-2xl border-2 border-nouvo-green/20 p-6 overflow-y-auto">
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

type TabId = 'business' | 'receipt' | 'printer' | 'orders' | 'system'

const activeTab = ref<TabId>('business')

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'business', label: 'Business', icon: '🏢' },
  { id: 'receipt', label: 'Receipt', icon: '🧾' },
  { id: 'printer', label: 'Printer', icon: '🖨️' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'system', label: 'System', icon: '⚙️' }
]

const userName = computed(() => auth.user?.username ?? 'User')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const navTabs = [
  { path: '/home', label: 'Dashboard' },
  { path: '/orders', label: 'Orders' },
  { path: '/menu', label: 'Menu' },
  { path: '/order-timer', label: 'Order Timer' },
  { path: '/reports', label: 'Reports' },
  { path: '/settings', label: 'Settings' }
]

function navigate(tab: any) { router.push(tab.path) }
async function logout() { await auth.logout(); router.push('/login') }
</script>
