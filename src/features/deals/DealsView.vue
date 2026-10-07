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

    <div class="px-6 pt-4 pb-3 flex items-center justify-between shrink-0">
      <h1 class="text-xl font-bold text-nouvo-green">Deals</h1>
      <button
        class="cursor-pointer bg-nouvo-gold text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity"
        @click="openDealModal()"
      >+ New Deal</button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div v-if="loading" class="text-center text-nouvo-gray py-16 text-sm">Loading deals...</div>
      <div v-else-if="deals.length === 0" class="flex flex-col items-center justify-center py-20 text-nouvo-gray">
        <div class="text-5xl opacity-30 mb-3">⭐</div>
        <div class="text-sm font-semibold">No deals yet</div>
        <button class="cursor-pointer mt-4 bg-nouvo-gold text-white px-4 py-2 rounded-lg text-[13px] font-semibold" @click="openDealModal()">+ Create First Deal</button>
      </div>
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        <div v-for="deal in deals" :key="deal.id"
          class="group bg-white rounded-2xl p-4 border-2 border-transparent hover:border-nouvo-gold transition-colors flex flex-col"
          :class="{ 'opacity-50': !deal.is_active }">
          <div class="h-32 bg-nouvo-cream rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            <img v-if="deal.image_path" :src="fileUrl(deal.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
            <span v-else class="text-4xl opacity-40">⭐</span>
          </div>
          <h3 class="text-[15px] font-bold text-nouvo-ink mb-1 line-clamp-2">{{ deal.name }}</h3>
          <p class="text-[16px] font-bold text-nouvo-gold mb-2">Rs. {{ Number(deal.price).toFixed(2) }}</p>
          <div class="flex gap-1 flex-wrap mb-3">
            <span v-if="deal.is_active" class="text-[10px] bg-nouvo-green/10 text-nouvo-green px-1.5 py-0.5 rounded">Active</span>
            <span v-else class="text-[10px] bg-nouvo-red/20 text-nouvo-red px-1.5 py-0.5 rounded">Inactive</span>
          </div>
          <div class="flex gap-1.5 justify-end mt-auto">
            <button
              type="button"
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream hover:bg-nouvo-gold hover:text-white text-nouvo-gray flex items-center justify-center transition-colors"
              title="Duplicate"
              @click="duplicateDeal(deal)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button
              type="button"
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream hover:bg-nouvo-gold hover:text-white text-nouvo-gray flex items-center justify-center transition-colors"
              title="Edit"
              @click="openDealModal(deal.id)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              type="button"
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream hover:bg-nouvo-gold hover:text-white text-nouvo-gray flex items-center justify-center transition-colors"
              :title="deal.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleDeal(deal)"
            >
              <svg v-if="deal.is_active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button
              type="button"
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream hover:bg-nouvo-red hover:text-white text-nouvo-gray flex items-center justify-center transition-colors"
              title="Delete"
              @click="deleteDeal(deal)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <DealEditorModal
      v-if="showDealModal"
      :deal-id="editingDealId"
      :duplicate-from="duplicateDealSource"
      @close="closeDealModal"
      @saved="onDealSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { invokeSafe } from '@/utils/ipc'
import DealEditorModal from './components/DealEditorModal.vue'

const router = useRouter()
const auth = useAuthStore()

const deals = ref<any[]>([])
const loading = ref(false)
const showDealModal = ref(false)
const editingDealId = ref<number | null>(null)
const duplicateDealSource = ref<any>(null)

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

async function loadDeals() {
  loading.value = true
  const res = await invokeSafe<any>('deals:list', true, false)
  loading.value = false
  if (res.ok) deals.value = res.data || []
}

function openDealModal(dealId?: number) {
  editingDealId.value = dealId ?? null
  duplicateDealSource.value = null
  showDealModal.value = true
}
function duplicateDeal(deal: any) {
  editingDealId.value = null
  duplicateDealSource.value = deal
  showDealModal.value = true
}
function closeDealModal() {
  showDealModal.value = false
  editingDealId.value = null
  duplicateDealSource.value = null
}
async function onDealSaved() {
  closeDealModal()
  await loadDeals()
}
async function toggleDeal(deal: any) {
  await invokeSafe('deals:toggle', deal.id)
  await loadDeals()
}
async function deleteDeal(deal: any) {
  if (!confirm(`Delete deal "${deal.name}"?`)) return
  const res = await invokeSafe<any>('deals:delete', deal.id)
  if (res.ok) await loadDeals()
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}

onMounted(loadDeals)
</script>
