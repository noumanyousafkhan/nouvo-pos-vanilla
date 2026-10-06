<template>
  <aside class="w-56 bg-nouvo-green text-white flex flex-col p-5 shrink-0">
    <div class="flex items-center gap-3 pb-5 mb-5 border-b border-white/10">
      <div class="w-10 h-10 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold">
        N
      </div>
      <div>
        <div class="text-sm font-bold tracking-wide">NOUVO POS</div>
        <div class="text-[10px] tracking-[2px] text-nouvo-green-light">VANILLA</div>
      </div>
    </div>

    <nav class="flex-1 flex flex-col gap-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
        :class="
          isActive(item.path)
            ? 'bg-nouvo-cream text-nouvo-green font-semibold'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
        "
      >
        <span class="text-lg w-5 text-center">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="pt-4 border-t border-white/10">
      <div class="flex items-center gap-2.5 p-2">
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold text-sm">
          {{ userInitial }}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold truncate">{{ userName }}</div>
          <div class="text-[10px] text-nouvo-green-light">{{ userRole }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { path: '/home', label: 'Dashboard', icon: '▦' },
  { path: '/pos', label: 'New Order', icon: '＋' },
  { path: '/orders', label: 'Orders', icon: '☰' },
  { path: '/menu', label: 'Menu', icon: '≡' },
  { path: '/settings', label: 'Settings', icon: '⚙' }
]

const userName = computed(() => auth.user?.username ?? 'User')
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})
const userInitial = computed(() => (userName.value?.[0] ?? 'U').toUpperCase())

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>
