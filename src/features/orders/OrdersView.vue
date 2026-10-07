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

    <div class="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
      <h1 class="text-xl font-bold text-nouvo-green">Order History</h1>
      <div class="flex items-center gap-6 text-[13px]">
        <div>
          <span class="text-nouvo-gray">Orders:</span>
          <span class="font-bold text-nouvo-ink ml-1">{{ store.stats.count }}</span>
        </div>
        <div>
          <span class="text-nouvo-gray">Revenue:</span>
          <span class="font-bold text-nouvo-ink ml-1">{{ currency }} {{ store.stats.revenue.toFixed(0) }}</span>
        </div>
        <div>
          <span class="text-nouvo-gray">Avg:</span>
          <span class="font-bold text-nouvo-ink ml-1">{{ currency }} {{ store.stats.avg_order.toFixed(0) }}</span>
        </div>
      </div>
    </div>

    <div class="px-6 pt-2">
      <OrdersFilters v-model="filters" @apply="loadOrders" />
    </div>

    <div class="flex-1 overflow-hidden px-6 pb-6 pt-4">
      <div class="bg-white rounded-2xl border-2 border-nouvo-green/30 h-full flex flex-col overflow-hidden">
        <div v-if="store.loading" class="flex-1 flex items-center justify-center text-nouvo-gray text-sm">
          Loading...
        </div>
        <div v-else-if="store.orders.length === 0" class="flex-1 flex flex-col items-center justify-center text-nouvo-gray">
          <div class="text-5xl opacity-30 mb-3">📋</div>
          <div class="text-sm font-semibold">No orders found</div>
          <div class="text-xs mt-1">Try changing filters</div>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="w-full text-[13px]">
            <thead class="sticky top-0 bg-nouvo-cream z-10">
              <tr>
                <th class="text-left px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Invoice #</th>
                <th class="text-left px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Date</th>
                <th class="text-left px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Type</th>
                <th class="text-left px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Customer</th>
                <th class="text-left px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Payment</th>
                <th class="text-right px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Total</th>
                <th class="text-center px-4 py-3 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in store.orders"
                :key="order.id"
                class="border-t border-nouvo-gray-border/40 hover:bg-nouvo-cream/40 cursor-pointer transition-colors"
                @click="openDetail(order)"
              >
                <td class="px-4 py-3 font-mono text-nouvo-green font-semibold">{{ order.invoice_number }}</td>
                <td class="px-4 py-3 text-nouvo-ink">{{ formatDateTime(order.created_at) }}</td>
                <td class="px-4 py-3">
                  <span class="text-[10px] font-bold px-2 py-1 rounded" :class="typeBadge(order.order_type)">
                    {{ formatOrderType(order.order_type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-nouvo-ink">
                  <span v-if="order.customer_name">{{ order.customer_name }}</span>
                  <span v-else class="text-nouvo-gray">—</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-[11px] font-semibold text-nouvo-ink">
                    {{ order.payment_method === 'cash' ? '💵 Cash' : '💳 Card' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-bold text-nouvo-green">
                  {{ currency }} {{ Number(order.total).toFixed(1) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-[10px] font-bold px-2 py-1 rounded" :class="statusBadge(order.status)">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="store.total > filters.limit" class="flex items-center justify-center gap-3 p-4 border-t border-nouvo-gray-border/40">
            <button
              :disabled="filters.offset === 0"
              class="cursor-pointer px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-nouvo-cream text-nouvo-green disabled:opacity-40 disabled:cursor-not-allowed"
              @click="prevPage"
            >← Prev</button>
            <span class="text-[12px] text-nouvo-gray">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              :disabled="filters.offset + filters.limit >= store.total"
              class="cursor-pointer px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-nouvo-cream text-nouvo-green disabled:opacity-40 disabled:cursor-not-allowed"
              @click="nextPage"
            >Next →</button>
          </div>
        </div>
      </div>
    </div>

    <OrderDetailModal
      v-if="selectedOrder"
      :order="selectedOrder"
      @close="selectedOrder = null"
      @updated="onOrderUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import OrdersFilters from './components/OrdersFilters.vue'
import OrderDetailModal from './components/OrderDetailModal.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useOrdersStore()

const selectedOrder = ref<any>(null)
const currency = ref('Rs.')

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

const filters = ref<any>({
  search: '',
  range: 'all',
  orderType: undefined,
  paymentMethod: undefined,
  status: 'completed',
  includeVoided: false,
  limit: 50,
  offset: 0
})

const currentPage = computed(() => Math.floor(filters.value.offset / filters.value.limit) + 1)
const totalPages = computed(() => Math.max(1, Math.ceil(store.total / filters.value.limit)))

function navigate(tab: any) { router.push(tab.path) }
async function logout() { await auth.logout(); router.push('/login') }

async function loadOrders() {
  filters.value.offset = 0
  await store.load(filters.value)
}

function prevPage() {
  filters.value.offset = Math.max(0, filters.value.offset - filters.value.limit)
  store.load(filters.value)
}

function nextPage() {
  filters.value.offset += filters.value.limit
  store.load(filters.value)
}

function openDetail(order: any) {
  selectedOrder.value = order
}

async function onOrderUpdated() {
  selectedOrder.value = null
  await store.load(filters.value)
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatOrderType(t: string) {
  if (t === 'dine_in') return 'Dine-In'
  if (t === 'takeaway') return 'Takeaway'
  if (t === 'delivery') return 'Delivery'
  return t
}

function typeBadge(t: string) {
  if (t === 'dine_in') return 'bg-nouvo-green/10 text-nouvo-green'
  if (t === 'takeaway') return 'bg-nouvo-gold/20 text-nouvo-gold'
  if (t === 'delivery') return 'bg-nouvo-red/10 text-nouvo-red'
  return 'bg-gray-100 text-gray-700'
}

function statusBadge(s: string) {
  if (s === 'voided') return 'bg-nouvo-red/15 text-nouvo-red'
  return 'bg-nouvo-green/10 text-nouvo-green'
}

onMounted(async () => {
  const s = await (window as any).nouvo.invoke('settings:getBusiness')
  if (s?.ok) currency.value = s.data.currency_symbol
  await store.load(filters.value)
})
</script>
