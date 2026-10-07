<template>
  <div class="h-screen bg-nouvo-cream flex flex-col">
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

    <main class="flex-1 flex items-center justify-center p-6">
      <div class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-10 max-w-md text-center">
        <h1 class="text-2xl font-bold text-nouvo-green mb-3">Welcome, {{ userName }}</h1>
        <p class="text-sm text-nouvo-gray mb-8">Ready to take orders?</p>
        <button
          type="button"
          class="cursor-pointer bg-nouvo-green text-white px-8 py-4 rounded-full font-bold text-base hover:bg-nouvo-green-dark transition-colors w-full"
          @click="$router.push('/pos')"
        >Open POS →</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

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
  { path: '/order-timer', label: 'Order Timer', query: {} },
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
