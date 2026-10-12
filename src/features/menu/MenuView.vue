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
            <span class="w-5 h-5 flex items-center justify-center shrink-0" v-html="getCategoryIcon(cat.name, selectedCategoryId === cat.id)"></span>
            <span class="flex-1 text-sm font-medium truncate">{{ cat.name }}</span>
            <span class="text-xs opacity-70 group-hover:hidden">{{ getCategoryCount(cat) }}</span>
            <div class="hidden group-hover:flex items-center gap-0.5">
              <button
                class="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center text-[11px]"
                title="Edit"
                @click.stop="openCategoryModal(cat)"
              >✏️</button>
              <button
                class="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center text-[11px]"
                :title="cat.is_active ? 'Deactivate' : 'Activate'"
                @click.stop="toggleCategory(cat)"
              >{{ cat.is_active ? '👁️' : '🚫' }}</button>
              <button
                class="w-6 h-6 rounded hover:bg-red-500/20 flex items-center justify-center text-[11px]"
                title="Delete"
                @click.stop="deleteCategory(cat)"
              >🗑️</button>
            </div>
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
              class="group relative border border-nouvo-gray-border rounded-xl p-4 hover:border-nouvo-green transition-colors">
              <div class="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 z-10">
                <button
                  class="w-7 h-7 rounded bg-white border border-nouvo-gray-border hover:bg-nouvo-cream flex items-center justify-center text-[12px]"
                  :title="deal.is_active ? 'Deactivate' : 'Activate'"
                  @click.stop="toggleDeal(deal)"
                >{{ deal.is_active ? '👁️' : '🚫' }}</button>
                <button
                  class="w-7 h-7 rounded bg-white border border-nouvo-gray-border hover:bg-red-50 flex items-center justify-center text-[12px]"
                  title="Delete"
                  @click.stop="deleteDeal(deal)"
                >🗑️</button>
              </div>
              <div @click="openDealModal(deal.id)" class="cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="w-16 h-16 rounded-lg bg-nouvo-cream flex items-center justify-center overflow-hidden shrink-0">
                    <img v-if="deal.image_path" :src="fileUrl(deal.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                    <span v-else class="text-2xl">⭐</span>
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
        </div>

        <div v-else class="h-full">
          <div v-if="!productsLoading && products.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-nouvo-gray text-sm">
            <p>No products in this category</p>
            <button class="cursor-pointer bg-nouvo-green text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark" @click="openProductModal()">+ Add Product</button>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="product in products" :key="product.id"
              class="group relative border border-nouvo-gray-border rounded-xl p-4 hover:border-nouvo-green transition-colors">
              <div class="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 z-10">
                <button
                  class="w-7 h-7 rounded bg-white border border-nouvo-gray-border hover:bg-nouvo-cream flex items-center justify-center text-[12px]"
                  :title="product.is_active ? 'Deactivate' : 'Activate'"
                  @click.stop="toggleProduct(product)"
                >{{ product.is_active ? '👁️' : '🚫' }}</button>
                <button
                  class="w-7 h-7 rounded bg-white border border-nouvo-gray-border hover:bg-nouvo-cream flex items-center justify-center text-[12px]"
                  title="Duplicate"
                  @click.stop="openProductModal(undefined, product)"
                >📋</button>
                <button
                  class="w-7 h-7 rounded bg-white border border-nouvo-gray-border hover:bg-red-50 flex items-center justify-center text-[12px]"
                  title="Delete"
                  @click.stop="deleteProduct(product)"
                >🗑️</button>
              </div>
              <div @click="openProductModal(product.id)" class="cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="w-16 h-16 rounded-lg bg-nouvo-cream flex items-center justify-center overflow-hidden shrink-0">
                    <img v-if="product.image_path" :src="fileUrl(product.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                    <span v-else class="text-2xl">{{ getProductEmoji(product.name) }}</span>
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
import { useMenuStore } from '@/stores/menu'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'
import CategoryModal from './components/CategoryModal.vue'
import ProductEditorModal from './components/ProductEditorModal.vue'
import DealEditorModal from '@/features/deals/components/DealEditorModal.vue'

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

async function toggleCategory(cat: any) {
  const res = await invokeSafe<any>('menu:categories:toggle', cat.id)
  if (res.ok) {
    await menu.loadCategories(true)
    await loadCounts()
  }
}

async function deleteCategory(cat: any) {
  if (!confirm(`Delete category "${cat.name}"?`)) return
  const res = await invokeSafe<any>('menu:categories:delete', cat.id)
  if (res.ok) {
    await menu.loadCategories(true)
    await loadCounts()
    if (selectedCategoryId.value === cat.id) {
      selectedCategoryId.value = null
      selectedCategoryName.value = ''
      products.value = []
    }
  } else {
    alert('Delete failed: ' + ((res as any).error?.message || 'Unknown'))
  }
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

async function toggleProduct(product: any) {
  const res = await invokeSafe<any>('menu:products:toggle', product.id)
  if (res.ok) {
    await loadProducts()
    await loadCounts()
  }
}

async function deleteProduct(product: any) {
  if (!confirm(`Delete product "${product.name}"?`)) return
  const res = await invokeSafe<any>('menu:products:softDelete', product.id)
  if (res.ok) {
    await loadProducts()
    await loadCounts()
  } else {
    alert('Delete failed: ' + ((res as any).error?.message || 'Unknown'))
  }
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

async function toggleDeal(deal: any) {
  const res = await invokeSafe<any>('deals:toggle', deal.id)
  if (res.ok) {
    await loadDeals()
  }
}

async function deleteDeal(deal: any) {
  if (!confirm(`Delete deal "${deal.name}"?`)) return
  const res = await invokeSafe<any>('deals:delete', deal.id)
  if (res.ok) {
    await loadDeals()
  } else {
    alert('Delete failed: ' + ((res as any).error?.message || 'Unknown'))
  }
}

/* ═══════════════════════════════════════════════════════
   PRODUCT EMOJI MAPPER
   ═══════════════════════════════════════════════════════ */
const PRODUCT_EMOJI: Array<[RegExp, string]> = [
  [/pizza/i, '🍕'],
  [/burger|zinger|sandwich/i, '🍔'],
  [/wrap|shawarma|roll/i, '🌯'],
  [/fries|chips|nugget|wing/i, '🍟'],
  [/cola|coke|pepsi|sprite|7up|fanta|mirinda|dew|soda|drink|water|juice|shake|smoothie|lime/i, '🥤'],
  [/coffee|espresso|latte|cappuccino|macchiato|americano|mocha/i, '☕'],
  [/tea|chai|jasmine|earl|chamomile/i, '🍵'],
  [/salad/i, '🥗'],
  [/cake|brownie|dessert|muffin|macaroon/i, '🍰'],
  [/ice.?cream/i, '🍦'],
  [/bread|toast/i, '🍞']
]

function getProductEmoji(name: string): string {
  const n = String(name || '').trim()
  for (const [re, emoji] of PRODUCT_EMOJI) {
    if (re.test(n)) return emoji
  }
  return '🍽'
}

function getCategoryIcon(catName: string, isActive: boolean = false): string {
  const name = String(catName || '').trim().toLowerCase()
  const color = isActive ? '#FFFFFF' : '#025726'

  if (name === 'pizza') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 12 L68 62 Q40 74 12 62 Z" fill="${color}"/>
      <circle cx="34" cy="42" r="2.5" fill="#F5F1E8"/>
      <circle cx="46" cy="46" r="2.5" fill="#F5F1E8"/>
      <circle cx="40" cy="56" r="2.5" fill="#F5F1E8"/>
    </svg>`
  }
  if (name === 'burgers' || name === 'burger') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 32 Q14 14 40 14 Q66 14 66 32 Z" fill="${color}"/>
      <rect x="12" y="34" width="56" height="6" rx="2" fill="${color}"/>
      <rect x="12" y="42" width="56" height="6" rx="2" fill="${color}"/>
      <path d="M14 50 Q14 66 40 66 Q66 66 66 50 Z" fill="${color}"/>
    </svg>`
  }
  if (name === 'shawarma') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 40 Q40 12 64 40 L60 60 Q40 52 20 60 Z" fill="${color}"/>
      <path d="M16 40 Q40 30 64 40" stroke="#F5F1E8" stroke-width="2" fill="none"/>
    </svg>`
  }
  if (name === 'wraps') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="40" rx="22" ry="28" fill="${color}"/>
      <path d="M26 26 Q40 20 54 26" stroke="#F5F1E8" stroke-width="2" fill="none"/>
      <path d="M26 34 Q40 28 54 34" stroke="#F5F1E8" stroke-width="2" fill="none"/>
    </svg>`
  }
  if (name === 'sides') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 34 L26 68 Q27 72 32 72 L48 72 Q53 72 54 68 L58 34 Z" fill="${color}"/>
      <rect x="20" y="30" width="40" height="6" rx="2" fill="${color}"/>
      <rect x="28" y="14" width="5" height="18" rx="1.5" fill="${color}"/>
      <rect x="37" y="10" width="5" height="22" rx="1.5" fill="${color}"/>
    </svg>`
  }
  if (name === 'drinks') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 26 L26 66 Q27 70 32 70 L48 70 Q53 70 54 66 L58 26 Z" fill="${color}"/>
      <ellipse cx="40" cy="26" rx="18" ry="4" fill="${color}"/>
      <rect x="42" y="6" width="3" height="20" rx="1.5" fill="${color}" transform="rotate(15 43 16)"/>
    </svg>`
  }
  if (name === 'deals') {
    return `<svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 8 C41.5 8, 42.8 9, 43.3 10.4 L48.4 25 L63.7 25.1 C65.2 25.1, 66.4 26.3, 66.4 27.8 C66.4 28.5, 66.1 29.2, 65.6 29.7 L53.3 38.9 L57.7 53.9 C58.2 55.6, 57.3 57.4, 55.6 57.9 C54.9 58.1, 54.2 58.1, 53.6 57.8 L40 48.3 L26.4 57.8 C25 58.7, 23.1 58.3, 22.2 56.9 C21.9 56.3, 21.8 55.6, 22 55 L26.4 39.9 L14.1 29.7 C12.8 28.6, 12.7 26.7, 13.8 25.4 C14.4 24.8, 15.1 24.4, 15.9 24.4 L31.6 24.4 L36.7 10.4 C37.2 9, 38.5 8, 40 8 Z" fill="${color}"/>
    </svg>`
  }
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>`
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
