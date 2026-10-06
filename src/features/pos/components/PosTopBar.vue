<template>
  <header class="flex items-center justify-between px-6 lg:px-8 pt-6 pb-4 shrink-0">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-3">
        <img
          v-if="store.business.logo_path"
          :src="fileUrl(store.business.logo_path)"
          alt="Logo"
          class="h-12 w-12 object-contain shrink-0"
        />
        <div class="leading-none text-left">
          <div class="text-[14px] font-black text-nouvo-green tracking-[1.5px] uppercase">
            {{ store.businessName }}
          </div>
          <div
            v-if="store.business.slogan && store.business.slogan.trim()"
            class="text-[9px] font-semibold text-nouvo-green tracking-[2.5px] mt-1 opacity-60 uppercase"
          >
            {{ store.business.slogan }}
          </div>
        </div>
      </div>

      <div class="text-[13px] text-nouvo-ink font-medium ml-2">{{ today }}</div>

      <button
        type="button"
        class="cursor-pointer bg-white border border-nouvo-gray-border rounded-full px-4 py-2 text-[12px] font-semibold text-nouvo-green flex items-center gap-1.5 hover:bg-nouvo-cream transition-colors shadow-sm"
        @click="$router.push('/home')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Dashboard
      </button>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-[12px] text-nouvo-gray">
        Total: <span class="font-semibold text-nouvo-ink">{{ totalOrders }} Orders</span>
      </div>

      <button
        type="button"
        class="cursor-pointer bg-white border border-nouvo-gray-border rounded-full px-4 py-2 text-[12px] font-semibold text-nouvo-green flex items-center gap-1.5 hover:bg-nouvo-cream transition-colors shadow-sm"
        @click="$router.push('/reports')"
      >
        Report
      </button>

      <button
        type="button"
        class="cursor-pointer relative w-11 h-11 bg-white border border-nouvo-gray-border rounded-full flex items-center justify-center hover:bg-nouvo-cream transition-colors shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-nouvo-red border border-white"></span>
      </button>

      <div v-if="userName" class="h-11 flex items-center gap-2.5 bg-white rounded-full pl-1 pr-4 shadow-sm border border-nouvo-gray-border">
        <div class="w-9 h-9 rounded-full bg-nouvo-green flex items-center justify-center font-bold text-[13px] text-white overflow-hidden shrink-0">
          {{ userInitial }}
        </div>
        <div class="leading-tight">
          <div class="text-[12px] font-bold text-nouvo-ink">{{ userName }}</div>
          <div class="text-[10px] text-nouvo-gray">{{ userRole }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'

const auth = useAuthStore()
const store = useSettingsStore()
const totalOrders = ref(0)

const userName = computed(() => auth.user?.username ?? '')
const userInitial = computed(() => (userName.value[0] ?? '').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role
  if (!r) return ''
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const today = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
)

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}

onMounted(async () => {
  try {
    const res = await invokeSafe<any>('orders:list', {
      range: 'today', limit: 1, offset: 0, status: 'completed'
    })
    if (res.ok && res.data) totalOrders.value = res.data.total
  } catch {}
})
</script>
