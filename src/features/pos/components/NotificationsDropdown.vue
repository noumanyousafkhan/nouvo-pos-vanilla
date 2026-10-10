<template>
  <div
    class="absolute right-0 top-[60px] w-[360px] bg-white border border-nouvo-gray-border rounded-2xl shadow-2xl z-50 overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-nouvo-gray-border">
      <div class="flex items-center gap-2">
        <span class="text-[13px] font-bold text-nouvo-ink">Notifications</span>
        <span
          v-if="unreadCount > 0"
          class="text-[10px] font-bold bg-nouvo-red text-white px-1.5 py-0.5 rounded-full"
        >{{ unreadCount }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="unreadCount > 0"
          type="button"
          class="cursor-pointer text-[10px] font-semibold text-nouvo-green hover:bg-nouvo-cream rounded-lg px-2 py-1"
          title="Mark all as read"
          @click="markAllRead"
        >Mark all read</button>
        <button
          type="button"
          class="cursor-pointer w-7 h-7 rounded-lg hover:bg-nouvo-cream text-nouvo-gray flex items-center justify-center"
          @click="$emit('close')"
        >✕</button>
      </div>
    </div>

    <!-- Body -->
    <div class="max-h-[400px] overflow-y-auto">
      <div v-if="loading" class="text-center text-nouvo-gray text-[12px] py-8">
        Loading...
      </div>

      <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-nouvo-gray">
        <div class="text-3xl opacity-30 mb-2">🔔</div>
        <div class="text-[12px] font-semibold">All caught up</div>
        <div class="text-[11px] mt-0.5">No new notifications</div>
      </div>

      <div v-else class="divide-y divide-nouvo-gray-border/60">
        <div
          v-for="(n, i) in notifications"
          :key="i"
          class="flex items-start gap-3 px-4 py-3 hover:bg-nouvo-cream/40 transition-colors cursor-pointer relative"
          :class="{ 'bg-nouvo-green/5': !n.read }"
          @click="handleClick(n, i)"
        >
          <!-- Unread dot -->
          <span
            v-if="!n.read"
            class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-nouvo-green"
          ></span>

          <!-- Icon -->
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
            :class="iconBg(n.type)"
          >{{ n.icon }}</div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div
              class="text-[12px] leading-tight"
              :class="n.read ? 'text-nouvo-ink/70 font-medium' : 'text-nouvo-ink font-bold'"
            >{{ n.title }}</div>
            <div
              class="text-[11px] mt-0.5"
              :class="n.read ? 'text-nouvo-gray/70' : 'text-nouvo-gray'"
            >{{ n.message }}</div>
            <div v-if="n.time" class="text-[10px] text-nouvo-gray/80 mt-1">{{ n.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="notifications.length > 0" class="px-4 py-2 border-t border-nouvo-gray-border bg-nouvo-cream/40">
      <div class="text-[10px] text-nouvo-gray text-center">
        Updates every 30 seconds
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { invokeSafe } from '@/utils/ipc'

const emit = defineEmits<{ close: []; navigate: [string] }>()
const router = useRouter()

interface Notification {
  type: 'new-order' | 'timer-critical' | 'backup' | 'voided' | 'license'
  icon: string
  title: string
  message: string
  time?: string
  timestampMs?: number
  path?: string
  read?: boolean
}

const loading = ref(false)
const notifications = ref<Notification[]>([])

/**
 * localStorage key for last read timestamp.
 * All notifications older than this are "read".
 */
const LS_KEY = 'nouvo.notif.lastReadAt'

function getLastReadAt(): number {
  try {
    const v = localStorage.getItem(LS_KEY)
    return v ? Number(v) : 0
  } catch {
    return 0
  }
}

function setLastReadAt(ms: number) {
  try {
    localStorage.setItem(LS_KEY, String(ms))
  } catch {}
}

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

function iconBg(type: string): string {
  if (type === 'new-order') return 'bg-nouvo-green/10 text-nouvo-green'
  if (type === 'timer-critical') return 'bg-orange-100 text-orange-600'
  if (type === 'voided') return 'bg-red-100 text-red-600'
  if (type === 'backup') return 'bg-blue-100 text-blue-600'
  if (type === 'license') return 'bg-yellow-100 text-yellow-700'
  return 'bg-nouvo-cream text-nouvo-gray'
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

async function loadNotifications() {
  loading.value = true
  const list: Notification[] = []
  const lastReadAt = getLastReadAt()

  // ═══════════════════════════════════════════════════════
  // 1. New orders — last 30 min
  // ═══════════════════════════════════════════════════════
  const activeRes = await invokeSafe<any>('orders:listActive')
  if (activeRes.ok && activeRes.data) {
    const now = Date.now()
    const recent = activeRes.data.filter((o: any) => {
      const ms = now - new Date(o.created_at.replace(' ', 'T') + 'Z').getTime()
      return ms < 30 * 60 * 1000
    })
    if (recent.length > 0) {
      const newest = recent[recent.length - 1]
      const newestMs = new Date(newest.created_at.replace(' ', 'T') + 'Z').getTime()
      list.push({
        type: 'new-order',
        icon: '📦',
        title: `${recent.length} new order${recent.length > 1 ? 's' : ''}`,
        message: `Order #${recent.map((o: any) => o.order_number.split('-').pop()).slice(0, 3).join(', #')}${recent.length > 3 ? '...' : ''}`,
        time: timeAgo(newest.created_at),
        timestampMs: newestMs,
        path: '/order-timer'
      })
    }

    // ═══════════════════════════════════════════════════════
    // 2. Timer critical — ≤ 5 min
    // ═══════════════════════════════════════════════════════
    const PREP_DEFAULT = 40
    const critical = activeRes.data.filter((o: any) => {
      const created = new Date(o.created_at.replace(' ', 'T') + 'Z').getTime()
      const remaining = (created + PREP_DEFAULT * 60 * 1000) - now
      return remaining > 0 && remaining <= 5 * 60 * 1000
    })
    if (critical.length > 0) {
      list.push({
        type: 'timer-critical',
        icon: '⚠️',
        title: `${critical.length} order${critical.length > 1 ? 's' : ''} about to delay`,
        message: 'Less than 5 minutes remaining',
        timestampMs: now,  // ⭐ critical notifications are always fresh
        path: '/order-timer'
      })
    }
  }

  // ═══════════════════════════════════════════════════════
  // 3. Backup status
  // ═══════════════════════════════════════════════════════
  try {
    const backupRes = await invokeSafe<any>('backup:list')
    if (backupRes.ok && backupRes.data && backupRes.data.length > 0) {
      const last = backupRes.data[0]
      const ts = last.created_at ? new Date(last.created_at).getTime() : Date.now()
      list.push({
        type: 'backup',
        icon: '💾',
        title: 'Backup available',
        message: `Last backup: ${last.created_at ? timeAgo(last.created_at) : 'unknown'}`,
        time: last.created_at ? timeAgo(last.created_at) : '',
        timestampMs: ts,
        path: '/settings'
      })
    } else {
      list.push({
        type: 'backup',
        icon: '💾',
        title: 'No backups yet',
        message: 'Create a backup in Settings',
        timestampMs: 0,
        path: '/settings'
      })
    }
  } catch {}

  // ═══════════════════════════════════════════════════════
  // 4. Voided today
  // ═══════════════════════════════════════════════════════
  try {
    const voidedRes = await invokeSafe<any>('orders:list', {
      range: 'today',
      limit: 50,
      offset: 0,
      status: 'voided',
      includeVoided: true
    })
    if (voidedRes.ok && voidedRes.data) {
      const count = voidedRes.data.total || 0
      if (count > 0) {
        list.push({
          type: 'voided',
          icon: '🚫',
          title: `${count} voided order${count > 1 ? 's' : ''} today`,
          message: 'Check Order History for details',
          timestampMs: Date.now(),  // todays voided — treat as fresh
          path: '/orders'
        })
      }
    }
  } catch {}

  // ═══════════════════════════════════════════════════════
  // 5. License placeholder
  // ═══════════════════════════════════════════════════════
  list.push({
    type: 'license',
    icon: '🔑',
    title: 'License active',
    message: 'Activation system coming soon',
    timestampMs: 0,
    path: '/settings'
  })

  // ═══════════════════════════════════════════════════════
  // Compute read state based on lastReadAt
  // ═══════════════════════════════════════════════════════
  for (const n of list) {
    n.read = (n.timestampMs ?? 0) <= lastReadAt
  }

  notifications.value = list
  loading.value = false
}

function markAllRead() {
  // Save current time as last-read
  setLastReadAt(Date.now())
  // Update local state
  for (const n of notifications.value) {
    n.read = true
  }
  emit('navigate', '')  // trigger parent to update dot
}

function handleClick(n: Notification, i: number) {
  // Mark this one as read (update timestamp if newer than lastReadAt)
  if (!n.read && n.timestampMs) {
    const lastRead = getLastReadAt()
    if (n.timestampMs > lastRead) {
      setLastReadAt(n.timestampMs)
      n.read = true
      emit('navigate', '')
    }
  }
  // Navigate
  if (n.path) {
    router.push(n.path)
    emit('close')
  }
}

let refreshInterval: any = null

onMounted(() => {
  loadNotifications()
  refreshInterval = setInterval(loadNotifications, 30000)
})

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>
