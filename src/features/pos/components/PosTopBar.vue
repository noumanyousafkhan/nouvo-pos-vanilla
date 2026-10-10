<template>
  <header class="flex items-center justify-between px-6 lg:px-8 pt-6 pb-4 shrink-0">
    <div class="flex items-center gap-4">
      <!-- Logo + Business Name (NOT clickable) -->
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

      <!-- Date -->
      <div class="text-[13px] text-nouvo-ink font-medium ml-2">{{ today }}</div>

      <!-- Dashboard button -->
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

      <!-- Order Timer button -->
      <button
        type="button"
        class="cursor-pointer bg-white border border-nouvo-gray-border rounded-full px-4 py-2 text-[12px] font-semibold text-nouvo-green flex items-center gap-1.5 hover:bg-nouvo-cream transition-colors shadow-sm"
        @click="$router.push('/order-timer')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="13" r="8"></circle>
          <polyline points="12 9 12 13 15 15"></polyline>
          <line x1="9" y1="2" x2="15" y2="2"></line>
        </svg>
        Order Timer
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

      <!-- Notifications bell + dropdown -->
      <div class="relative">
        <button
          type="button"
          class="cursor-pointer relative w-11 h-11 bg-white border border-nouvo-gray-border rounded-full flex items-center justify-center hover:bg-nouvo-cream transition-colors shadow-sm"
          @click.stop="toggleNotifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <!-- ⭐ Red dot — only when unreadCount > 0 -->
          <span
            v-if="unreadCount > 0"
            class="absolute top-2 right-2 w-2 h-2 rounded-full bg-nouvo-red border border-white"
          ></span>
        </button>

        <NotificationsDropdown
          v-if="showNotifications"
          @close="onDropdownClose"
          @navigate="refreshUnread"
        />
      </div>

      <div class="h-11 flex items-center gap-2.5 bg-white rounded-full pl-1 pr-4 shadow-sm border border-nouvo-gray-border">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'
import NotificationsDropdown from './NotificationsDropdown.vue'

const auth = useAuthStore()
const store = useSettingsStore()
const totalOrders = ref(0)

const showNotifications = ref(false)
const unreadCount = ref(0)

/**
 * localStorage key — same as NotificationsDropdown.vue
 */
const LS_KEY = 'nouvo.notif.lastReadAt'

const userName = computed(() => auth.user?.username ?? 'User')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const today = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
)

/**
 * Refresh the unread count.
 * A notification is unread if its timestamp > localStorage lastReadAt.
 * For simplicity, we check active orders — that's the most common notification.
 */
async function refreshUnread() {
  try {
    const lastRead = Number(localStorage.getItem(LS_KEY) || '0')
    const activeRes = await invokeSafe<any>('orders:listActive')
    if (activeRes.ok && activeRes.data) {
      const unread = activeRes.data.filter((o: any) => {
        const ms = new Date(o.created_at.replace(' ', 'T') + 'Z').getTime()
        return ms > lastRead
      })
      unreadCount.value = unread.length > 0 ? unread.length : 0
    } else {
      unreadCount.value = 0
    }
  } catch {
    unreadCount.value = 0
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function onDropdownClose() {
  showNotifications.value = false
  // Refresh dot after dropdown closes
  refreshUnread()
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    if (showNotifications.value) {
      showNotifications.value = false
      refreshUnread()
    }
  }
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  // using nouvo-file protocol
  return `nouvo-file:///${normalized}`
}

onMounted(async () => {
  try {
    const res = await invokeSafe<any>('orders:list', {
      range: 'all', limit: 1, offset: 0, status: 'completed'
    })
    if (res.ok && res.data) totalOrders.value = res.data.total
  } catch {}

  await refreshUnread()
  document.addEventListener('click', onClickOutside)

  // Periodic refresh every 60 seconds
  setInterval(refreshUnread, 60000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
