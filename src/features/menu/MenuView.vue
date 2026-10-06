<template>
  <div class="h-screen flex flex-col bg-nouvo-cream overflow-hidden">
    <header class="h-16 bg-nouvo-green text-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-3 shrink-0">
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold">N</div>
        <span class="font-bold tracking-wide text-[14px]">NOUVO POS</span>
      </div>
      <nav class="flex items-center gap-1 flex-1 justify-center">
        <button v-for="tab in navTabs" :key="tab.path" type="button"
          class="cursor-pointer px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          :class="$route.path === tab.path ? 'bg-nouvo-cream text-nouvo-green' : 'text-white/80 hover:bg-white/10 hover:text-white'"
          @click="navigate(tab)">{{ tab.label }}</button>
      </nav>
      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right leading-tight">
          <div class="text-[12px] font-bold">{{ userName }}</div>
          <div class="text-[10px] text-white/60">{{ userRole }}</div>
        </div>
        <div class="w-9 h-9 rounded-full bg-nouvo-cream text-nouvo-green flex items-center justify-center font-bold text-[13px]">{{ userInitial }}</div>
        <button type="button" class="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg text-[12px] font-medium transition-colors" @click="logout">Logout</button>
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
            <div class="hidden group-hover:flex gap-1" @click.stop>
              <button type="button" class="cursor-pointer w-6 h-6 rounded text-xs hover:bg-white/20" @click="openCategoryModal(cat)">✎</button>
              <button type="button" class="cursor-pointer w-6 h-6 rounded text-xs hover:bg-white/20" @click="toggleCategory(cat)">⇄</button>
              <button type="button" class="cursor-pointer w-6 h-6 rounded text-xs hover:bg-white/20" @click="deleteCategory(cat)">✕</button>
            </div>
          </li>
        </ul>
        <p v-if="menu.categories.length === 0" class="text-sm text-nouvo-gray text-center py-6">No categories yet</p>
      </aside>

      <main class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-4 overflow-y-auto">
        <div v-if="!selectedCategoryId" class="h-full flex items-center justify-center text-nouvo-gray text-sm">Select a category</div>

        <!-- Deals Category view -->
        <div v-else-if="isDealsCategory" class="h-full">
          <div v-if="deals.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
            <p>No deals yet</p>
            <button class="cursor-pointer bg-nouvo-gold text-white px-4 py-2 rounded-lg text-[13px] font-semibold" @click="openDealModal()">+ Add First Deal</button>
          </div>
          <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            <div v-for="deal in deals" :key="deal.id"
              class="group bg-nouvo-cream rounded-xl p-3 border-2 border-transparent hover:border-nouvo-gold transition-colors flex flex-col"
              :class="{ 'opacity-50': !deal.is_active }">
              <div class="h-24 bg-white rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                <img v-if="deal.image_path" :src="fileUrl(deal.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                <span v-else class="text-3xl opacity-40">⭐</span>
              </div>
              <h3 class="text-sm font-semibold text-nouvo-ink mb-1 line-clamp-2">{{ deal.name }}</h3>
              <p class="text-sm font-bold text-nouvo-green mb-2">Rs. {{ Number(deal.price).toFixed(2) }}</p>
              <div class="flex gap-1 flex-wrap mb-2">
                <span v-if="deal.is_active" class="text-[10px] bg-nouvo-green/10 text-nouvo-green px-1.5 py-0.5 rounded">Active</span>
                <span v-else class="text-[10px] bg-nouvo-red/20 text-nouvo-red px-1.5 py-0.5 rounded">Inactive</span>
              </div>
              <div class="flex gap-1 justify-end mt-auto">
                <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-green/10 text-xs" title="Edit" @click="openDealModal(deal.id)">✎</button>
                <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-green/10 text-xs" title="Toggle" @click="toggleDeal(deal)">⇄</button>
                <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-red/20 text-nouvo-red text-xs" title="Delete" @click="deleteDeal(deal)">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Normal category view -->
        <div v-else-if="menu.products.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
          <p>No products in this category</p>
          <button class="cursor-pointer bg-nouvo-green text-white px-4 py-2 rounded-lg text-[13px] font-semibold" @click="openProductModal()">Add Product</button>
        </div>
        <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          <div v-for="product in menu.products" :key="product.id"
            class="group bg-nouvo-cream rounded-xl p-3 border-2 border-transparent hover:border-nouvo-green transition-colors flex flex-col"
            :class="{ 'opacity-50': !product.is_active }">
            <div class="h-24 bg-white rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              <img v-if="product.image_path" :src="fileUrl(product.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
              <span v-else class="text-3xl opacity-40">🍽</span>
            </div>
            <h3 class="text-sm font-semibold text-nouvo-ink mb-1 line-clamp-2">{{ product.name }}</h3>
            <p class="text-sm font-bold text-nouvo-green mb-2">Rs. {{ Number(product.price).toFixed(2) }}</p>
            <div class="flex gap-1 flex-wrap mb-2">
              <span v-if="product.has_variants" class="text-[10px] bg-nouvo-green/10 text-nouvo-green px-1.5 py-0.5 rounded">Variants</span>
              <span v-if="product.has_modifiers" class="text-[10px] bg-nouvo-gold/20 text-nouvo-gold px-1.5 py-0.5 rounded">Modifiers</span>
              <span v-if="!product.is_active" class="text-[10px] bg-nouvo-red/20 text-nouvo-red px-1.5 py-0.5 rounded">Inactive</span>
            </div>
            <div class="flex gap-1 justify-end mt-auto">
              <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-green/10 text-xs" @click="duplicateProduct(product)">⎘</button>
              <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-green/10 text-xs" @click="openProductModal(product.id)">✎</button>
              <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-green/10 text-xs" @click="toggleProduct(product)">⇄</button>
              <button type="button" class="cursor-pointer w-7 h-7 rounded bg-white hover:bg-nouvo-red/20 text-nouvo-red text-xs" @click="deleteProduct(product)">✕</button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <CategoryModal v-if="showCategoryModal" :category="editingCategory" @close="closeCategoryModal" @saved="onCategorySaved" />
    <ProductEditorModal
      v-if="showProductModal"
      :product-id="editingProductId"
      :category-id="selectedCategoryId"
      :duplicate-from="duplicateFrom"
      @close="closeProductModal"
      @saved="onProductSaved"
    />
    <DealEditorModal
      v-if="showDealModal"
      :deal-id="editingDealId"
      @close="closeDealModal"
      @saved="onDealSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { invokeSafe } from '@/utils/ipc'
import CategoryModal from './components/CategoryModal.vue'
import ProductEditorModal from './components/ProductEditorModal.vue'
import DealEditorModal from '@/features/deals/components/DealEditorModal.vue'

const router = useRouter()
const auth = useAuthStore()
const menu = useMenuStore()

const selectedCategoryId = ref<number | null>(null)
const selectedCategoryName = ref<string>('')
const productCounts = ref<Record<number, number>>({})
const dealsCount = ref<number>(0)
const deals = ref<any[]>([])

const showCategoryModal = ref(false)
const editingCategory = ref<any>(null)
const showProductModal = ref(false)
const editingProductId = ref<number | null>(null)
const duplicateFrom = ref<any>(null)
const showDealModal = ref(false)
const editingDealId = ref<number | null>(null)

const userName = computed(() => auth.user?.username ?? 'User')
const userInitial = computed(() => (userName.value[0] ?? 'U').toUpperCase())
const userRole = computed(() => {
  const r = auth.user?.role ?? 'cashier'
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Cashier'
})

const isDealsCategory = computed(() =>
  selectedCategoryName.value.trim().toLowerCase() === 'deals'
)

const navTabs = [
  { path: '/home', label: 'Dashboard' },
  { path: '/orders', label: 'Orders' },
  { path: '/menu', label: 'Menu' },
  { path: '/reports', label: 'Reports' },
  { path: '/settings', label: 'Settings' }
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
    // Skip "Deals" — its count comes from deals
    if (cat.name.trim().toLowerCase() === 'deals') continue
    const res = await invokeSafe<any>('menu:products:list', cat.id, false)
    if (res.ok) counts[cat.id] = (res.data || []).length
  }
  productCounts.value = counts
}

function getCategoryCount(cat: any): number {
  if (cat.name.trim().toLowerCase() === 'deals') return dealsCount.value
  return productCounts.value[cat.id] || 0
}

async function loadProducts() {
  if (!selectedCategoryId.value) { menu.products = []; return }
  await menu.loadProducts(selectedCategoryId.value, true)
}

async function loadDeals() {
  const res = await invokeSafe<any>('deals:list', true, false)
  if (res.ok) {
    deals.value = res.data || []
    dealsCount.value = deals.value.length
  }
}

function selectCategory(id: number) {
  selectedCategoryId.value = id
  const cat = menu.categories.find((c: any) => c.id === id)
  selectedCategoryName.value = cat?.name || ''
  if (isDealsCategory.value) {
    loadDeals()
  } else {
    loadProducts()
  }
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
  await loadAll()
  menu.notifyUpdate()
}

async function toggleCategory(cat: any) {
  await invokeSafe('menu:categories:toggle', cat.id)
  await loadAll()
  menu.notifyUpdate()
}

async function deleteCategory(cat: any) {
  if (!confirm(`Delete category "${cat.name}"?`)) return
  const res = await invokeSafe<any>('menu:categories:delete', cat.id)
  if (!res.ok) { alert(res.error?.message || 'Delete failed'); return }
  if (selectedCategoryId.value === cat.id) {
    selectedCategoryId.value = null
    menu.products = []
    selectedCategoryName.value = ''
  }
  await loadAll()
  menu.notifyUpdate()
}

/* Products */
function openProductModal(productId?: number) {
  if (!selectedCategoryId.value && !productId) { alert('Select a category first'); return }
  editingProductId.value = productId ?? null
  duplicateFrom.value = null
  showProductModal.value = true
}
function duplicateProduct(product: any) {
  editingProductId.value = null
  duplicateFrom.value = product
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
  menu.notifyUpdate()
}
async function toggleProduct(product: any) {
  await invokeSafe('menu:products:toggle', product.id)
  await loadProducts()
  menu.notifyUpdate()
}
async function deleteProduct(product: any) {
  if (!confirm(`Delete product "${product.name}"?`)) return
  const res = await invokeSafe<any>('menu:products:softDelete', product.id)
  if (res.ok) { await loadProducts(); await loadCounts(); menu.notifyUpdate() }
}

/* Deals */
function openDealModal(dealId?: number) {
  editingDealId.value = dealId ?? null
  showDealModal.value = true
}
function closeDealModal() {
  showDealModal.value = false
  editingDealId.value = null
}
async function onDealSaved() {
  closeDealModal()
  await loadDeals()
  menu.notifyUpdate()
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

onMounted(loadAll)
</script>
