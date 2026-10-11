<template>
  <div class="h-screen flex flex-col bg-nouvo-cream overflow-hidden">
    <header class="h-16 bg-nouvo-green text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3 shrink-0">
        <img
          v-if="businessLogo"
          :src="businessLogo"
          alt="Logo"
          class="w-9 h-9 rounded-full object-cover"
        />
        <div v-else class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold">N</div>
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
      <h1 class="text-xl font-bold text-nouvo-green">Menu Management</h1>
      <div class="flex gap-2">
        <button class="cursor-pointer bg-white border border-nouvo-gray-border text-nouvo-green px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-cream transition-colors" @click="openCategoryModal()">+ Category</button>
        <button
          v-if="!isDealsCategory"
          class="cursor-pointer bg-nouvo-green text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark transition-colors disabled:opacity-50"
          :disabled="!selectedCategoryId"
          @click="openProductModal()"
        >+ Product</button>
        <button
          v-else
          class="cursor-pointer bg-nouvo-gold text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-colors"
          @click="openDealModal()"
        >+ Deal</button>
      </div>
    </div>

    <div class="flex-1 grid grid-cols-[280px_1fr] gap-4 px-6 pb-6 overflow-hidden">
      <aside class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-4 overflow-y-auto">
        <h2 class="text-xs font-bold text-nouvo-gray uppercase tracking-wider mb-3">Categories</h2>
        <ul class="space-y-1">
          <li v-for="cat in menu.categories" :key="cat.id"
            class="group cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors"
            :class="[selectedCategoryId === cat.id ? 'bg-nouvo-green text-white' : 'hover:bg-nouvo-cream text-nouvo-ink', !cat.is_active ? 'opacity-50' : '']"
            @click="selectCategory(cat.id)">
            <span class="flex-1 text-sm font-medium truncate">{{ cat.name }}</span>
            <span class="text-xs opacity-70">{{ getCategoryCount(cat) }}</span>
          </li>
          <li v-if="menu.categories.length === 0" class="text-sm text-nouvo-gray text-center py-4">
            No categories yet
          </li>
        </ul>
      </aside>

      <main class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-5 overflow-y-auto">
        <div v-if="!selectedCategoryId" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
          <p>Select a category</p>
        </div>

        <div v-else-if="isDealsCategory" class="h-full">
          <div v-if="deals.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
            <p>No deals yet</p>
            <button class="cursor-pointer bg-nouvo-gold text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:opacity-90" @click="openDealModal()">+ Create Deal</button>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="deal in deals" :key="deal.id"
              class="border border-nouvo-gray-border rounded-xl p-4 hover:border-nouvo-green transition-colors cursor-pointer"
              @click="openDealModal(deal.id)">
              <div class="flex items-start gap-3">
                <div class="w-16 h-16 rounded-lg bg-nouvo-cream flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="deal.image_path" :src="fileUrl(deal.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                  <span v-else class="text-2xl">🍔</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-sm text-nouvo-ink truncate">{{ deal.name }}</h3>
                  <p class="text-xs text-nouvo-gray mt-0.5">{{ deal.items_count || 0 }} items</p>
                  <p class="text-sm font-bold text-nouvo-green mt-1">Rs. {{ Number(deal.price || 0).toFixed(0) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="h-full">
          <div v-if="!productsLoading && products.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
            <p>No products in this category</p>
            <button class="cursor-pointer bg-nouvo-green text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark" @click="openProductModal()">+ Add Product</button>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="product in products" :key="product.id"
              class="border border-nouvo-gray-border rounded-xl p-4 hover:border-nouvo-green transition-colors cursor-pointer"
              @click="openProductModal(product.id)">
              <div class="flex items-start gap-3">
                <div class="w-16 h-16 rounded-lg bg-nouvo-cream flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="product.image_path" :src="fileUrl(product.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                  <span v-else class="text-2xl">🍕</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-sm text-nouvo-ink truncate">{{ product.name }}</h3>
                  <p class="text-xs text-nouvo-gray mt-0.5" v-if="product.has_variants">Variants</p>
                  <p class="text-xs text-nouvo-gray mt-0.5" v-else-if="product.has_modifiers">Modifiers</p>
                  <p class="text-sm font-bold text-nouvo-green mt-1">Rs. {{ Number(product.price || 0).toFixed(0) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <CategoryModal
      v-if="showCategoryModal"
      :category="editingCategory"
      @close="closeCategoryModal"
      @saved="onCategorySaved"
    />

    <ProductEditorModal
      v-if="showProductModal"
      :product-id="editingProductId"
      :default-category-id="selectedCategoryId"
      :duplicate-from="duplicateFrom"
      @close="closeProductModal"
      @saved="onProductSaved"
    />

    <!-- DealEditorModal temporarily disabled -->
    <!-- <DealEditorModal
      v-if="showDealModal"
      :deal-id="editingDealId"
      :duplicate-from="duplicateDealSource"
      @close="closeDealModal"
      @saved="onDealSaved"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'
import CategoryModal from './components/CategoryModal.vue'
import ProductEditorModal from './components/ProductEditorModal.vue'

const router = useRouter()
const auth = useAuthStore()
const menu = useMenuStore()
const store = useSettingsStore()

const selectedCategoryId = ref<number | null>(null)
const selectedCategoryName = ref<string>('')
const productCounts = ref<Record<number, number>>({})
const dealsCount = ref<number>(0)
const deals = ref<any[]>([])
const products = ref<any[]>([])
const productsLoading = ref(false)

const showCategoryModal = ref(false)
const editingCategory = ref<any>(null)
const showProductModal = ref(false)
const editingProductId = ref<number | null>(null)
const duplicateFrom = ref<any>(null)
const showDealModal = ref(false)
const editingDealId = ref<number | null>(null)
const duplicateDealSource = ref<any>(null)

const userName = computed(() => auth.user?.username ?? 'User')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const businessLogo = computed(() => {
  const path = store.business?.logo_path
  if (!path) return ''
  const normalized = String(path).replace(/\\/g, '/')
  return `nouvo-file://${normalized}`
})

const isDealsCategory = computed(() =>
  selectedCategoryName.value.trim().toLowerCase() === 'deals'
)

const navTabs = [
  { label: 'Dashboard', path: '/home' },
  { label: 'Menu', path: '/menu' },
  { label: 'Orders', path: '/orders' },
  { label: 'Reports', path: '/reports' },
  { label: '⏱ Order Timer', path: '/order-timer' },
  { label: 'Settings', path: '/settings' }
]

function navigate(tab: any) { router.push(tab.path) }
async function logout() { await auth.logout(); router.push('/login') }

async function loadAll() {
  await menu.loadCategories(true)
  await loadCounts()
  await loadDeals()
}

async function loadCounts() {
  const counts: Record<number, number> = {}
  for (const cat of menu.categories) {
    if (String(cat.name).trim().toLowerCase() === 'deals') continue
    const res = await invokeSafe<any>('menu:products:list', Number(cat.id), false)
    if (res.ok) counts[cat.id] = (res.data || []).length
  }
  productCounts.value = counts
}

function getCategoryCount(cat: any): number {
  if (String(cat.name).trim().toLowerCase() === 'deals') return dealsCount.value
  return productCounts.value[cat.id] ?? 0
}

async function loadDeals() {
  const res = await invokeSafe<any>('deals:list', true, false)
  if (res.ok) {
    deals.value = res.data || []
    dealsCount.value = deals.value.length
  }
}

async function loadProducts() {
  if (selectedCategoryId.value === null) {
    products.value = []
    return
  }
  productsLoading.value = true
  const res = await invokeSafe<any>('menu:products:list', selectedCategoryId.value, false)
  if (res.ok) products.value = res.data || []
  productsLoading.value = false
}

function selectCategory(id: number) {
  selectedCategoryId.value = id
  const cat = menu.categories.find((c: any) => c.id === id)
  selectedCategoryName.value = cat?.name ?? ''
  if (isDealsCategory.value) loadDeals()
  else loadProducts()
}

function openCategoryModal(cat?: any) {
  editingCategory.value = cat ?? null
  showCategoryModal.value = true
}
function closeCategoryModal() {
  showCategoryModal.value = false
  editingCategory.value = null
}
async function onCategorySaved() {
  closeCategoryModal()
  await menu.loadCategories(true)
  await loadCounts()
}

function openProductModal(id?: number, duplicate?: any) {
  editingProductId.value = id ?? null
  duplicateFrom.value = duplicate ?? null
  showProductModal.value = true
}
function closeProductModal() {
  showProductModal.value = false
  editingProductId.value = null
  duplicateFrom.value = null
}
async function onProductSaved() {
  closeProductModal()
  await loadProducts()
  await loadCounts()
}

function openDealModal(id?: number, duplicate?: any) {
  editingDealId.value = id ?? null
  duplicateDealSource.value = duplicate ?? null
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

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = String(p).replace(/\\/g, '/')
  return `nouvo-file://${normalized}`
}

onMounted(async () => {
  await loadAll()
})
</script>
