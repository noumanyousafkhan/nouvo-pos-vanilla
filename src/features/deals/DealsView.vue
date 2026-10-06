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

    <!-- Header -->
    <div class="px-6 pt-4 pb-3 flex items-center justify-between shrink-0">
      <h1 class="text-xl font-bold text-nouvo-green">Deals & Combos</h1>
      <button
        class="cursor-pointer bg-nouvo-green text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark transition-colors"
        @click="openEditor()"
      >+ New Deal</button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div v-if="store.deals.length === 0" class="flex flex-col items-center justify-center gap-3 py-20 text-nouvo-gray">
        <p>No deals yet.</p>
        <NButton @click="openEditor()">Create your first deal</NButton>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        <div
          v-for="deal in store.deals"
          :key="deal.id"
          class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-4 flex flex-col"
          :class="{ 'opacity-60': !deal.is_active }"
        >
          <div class="h-32 bg-nouvo-cream rounded-lg flex items-center justify-center mb-3 overflow-hidden">
            <img
              v-if="deal.image_path"
              :src="fileUrl(deal.image_path)"
              class="max-w-full max-h-full object-contain"
              loading="lazy"
            />
            <span v-else class="text-4xl opacity-40">★</span>
          </div>
          <h3 class="text-base font-semibold text-nouvo-ink mb-1">{{ deal.name }}</h3>
          <p class="text-lg font-bold text-nouvo-green mb-2">Rs. {{ deal.price.toFixed(2) }}</p>
          <p
            v-if="deal.valid_from || deal.valid_to"
            class="text-[11px] text-nouvo-gray mb-2 flex gap-2"
          >
            <span v-if="deal.valid_from">From: {{ formatDate(deal.valid_from) }}</span>
            <span v-if="deal.valid_to">To: {{ formatDate(deal.valid_to) }}</span>
          </p>
          <div class="flex gap-1 flex-wrap mb-3">
            <span
              class="text-[10px] px-2 py-0.5 rounded font-medium"
              :class="deal.is_active ? 'bg-nouvo-green/10 text-nouvo-green' : 'bg-nouvo-red/20 text-nouvo-red'"
            >
              {{ deal.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="flex gap-1 justify-end mt-auto">
            <button
              class="cursor-pointer w-8 h-8 rounded bg-nouvo-cream hover:bg-nouvo-green/10 text-xs"
              title="Edit"
              @click="openEditor(deal.id)"
            >✎</button>
            <button
              class="cursor-pointer w-8 h-8 rounded bg-nouvo-cream hover:bg-nouvo-green/10 text-xs"
              title="Toggle"
              @click="toggleDeal(deal)"
            >⇄</button>
            <button
              class="cursor-pointer w-8 h-8 rounded bg-nouvo-cream hover:bg-nouvo-red/20 text-nouvo-red text-xs"
              title="Delete"
              @click="deleteDeal(deal)"
            >✕</button>
          </div>
        </div>
      </div>
    </div>

    <DealEditorModal
      v-if="showEditor"
      :deal-id="editingDealId"
      @close="closeEditor"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDealsStore } from '@/stores/deals'
import NButton from '@/components/ui/NButton.vue'
import DealEditorModal from './components/DealEditorModal.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useDealsStore()
const showEditor = ref(false)
const editingDealId = ref<number | null>(null)

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

async function loadAll() {
  await store.loadDeals(true, false)
}

function openEditor(id?: number) {
  editingDealId.value = id ?? null
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingDealId.value = null
}

async function onSaved() {
  closeEditor()
  await loadAll()
}

async function toggleDeal(deal: any) {
  await (window as any).nouvo.invoke('deals:toggle', deal.id)
  await loadAll()
}

async function deleteDeal(deal: any) {
  if (!confirm(`Delete deal "${deal.name}"?`)) return
  await (window as any).nouvo.invoke('deals:delete', deal.id)
  await loadAll()
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

onMounted(loadAll)
</script>
