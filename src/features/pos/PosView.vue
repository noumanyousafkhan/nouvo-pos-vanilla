<template>
  <div class="h-screen bg-nouvo-cream flex flex-col overflow-hidden">
    <PosTopBar />

    <div
      class="flex-1 grid gap-5 px-6 lg:px-8 pb-6 overflow-hidden transition-all duration-300"
      :class="collapsed ? 'grid-cols-[1fr]' : 'grid-cols-[1fr_minmax(340px,400px)]'"
    >
      <div class="flex flex-col gap-4 overflow-hidden min-w-0">
        <!-- Search + Filter + Cart (when collapsed) all in one row -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <PosSearchBar
              v-model="searchQuery"
              :sort-by="sortBy"
              :hide-out-of-stock="hideOutOfStock"
              @search="onSearch"
              @update:sort-by="sortBy = $event"
              @toggle-hide-oos="hideOutOfStock = $event"
            />
          </div>

          <!-- Cart expand button — right edge, same height as filter -->
          <button
            v-if="collapsed"
            type="button"
            class="cursor-pointer shrink-0 h-12 pl-3 pr-5 rounded-xl bg-nouvo-green text-white hover:bg-nouvo-green-dark transition-all flex items-center gap-2.5 active:scale-95"
            title="Show cart"
            @click="collapsed = false"
          >
            <!-- LEFT arrow (<) -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>

            <div class="relative shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span
                v-if="cart.itemCount > 0"
                class="absolute -top-1.5 -right-1.5 bg-nouvo-yellow text-nouvo-green rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold flex items-center justify-center border-2 border-nouvo-green"
              >{{ cart.itemCount }}</span>
            </div>

            <div class="leading-tight text-left">
              <div class="text-[10px] opacity-80 font-medium">Cart</div>
              <div class="text-[12px] font-bold">{{ store.currency }} {{ cart.total.toFixed(1) }}</div>
            </div>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 min-h-0">
          <CategoryTabs
            :categories="categories"
            :active-id="activeCategoryId"
            @select="selectCategory"
          />

          <div v-if="loadingProducts" class="text-center text-nouvo-gray p-10 text-sm">Loading...</div>

          <div v-else-if="isDealsCategory" class="grid grid-cols-4 gap-4">
            <div v-if="filteredDeals.length === 0" class="col-span-4 text-center text-nouvo-gray p-10 text-sm">
              No deals available
            </div>
            <div
              v-for="deal in filteredDeals"
              :key="deal.id"
              class="cursor-pointer bg-white rounded-2xl p-4 border-2 border-nouvo-gold/30 hover:border-nouvo-gold hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col"
              @click="addDeal(deal)"
            >
              <div class="h-[120px] bg-nouvo-cream rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                <img v-if="deal.image_path" :src="fileUrl(deal.image_path)" class="max-w-full max-h-full object-contain" loading="lazy" />
                <span v-else class="text-[52px] opacity-70">⭐</span>
              </div>
              <div class="text-[14px] font-bold text-nouvo-ink leading-tight mb-1 line-clamp-2">{{ deal.name }}</div>
              <div class="text-[16px] font-bold text-nouvo-gold">{{ store.currency }} {{ Number(deal.price).toFixed(2) }}</div>
              <button
                class="cursor-pointer mt-3 bg-nouvo-gold text-white rounded-lg py-2 text-[12px] font-bold hover:opacity-90 transition-opacity"
                @click.stop="addDeal(deal)"
              >+ Add to Cart</button>
            </div>
          </div>

          <div v-else-if="filteredProducts.length === 0" class="text-center text-nouvo-gray p-10 text-sm">
            No products found
          </div>
          <ProductGrid v-else :products="filteredProducts" @add="onProductAdd" />
        </div>
      </div>

      <div v-if="!collapsed" class="min-h-0">
        <CartPanel
          :collapsed="collapsed"
          @checkout="onCheckout"
          @toggle-collapse="collapsed = !collapsed"
        />
      </div>
    </div>

    <ProductCustomizationModal
      v-if="customizingProduct"
      :product="customizingProduct"
      @close="customizingProduct = null"
      @add="onCustomizedAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import PosTopBar from './components/PosTopBar.vue'
import PosSearchBar from './components/PosSearchBar.vue'
import CategoryTabs from './components/CategoryTabs.vue'
import ProductGrid from './components/ProductGrid.vue'
import CartPanel from './components/CartPanel.vue'
import ProductCustomizationModal from './components/ProductCustomizationModal.vue'
import { useCartStore } from '@/stores/cart'
import { useMenuStore } from '@/stores/menu'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'

const router = useRouter()
const cart = useCartStore()
const menuStore = useMenuStore()
const store = useSettingsStore()

const categories = ref<any[]>([])
const products = ref<any[]>([])
const deals = ref<any[]>([])
const activeCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const loadingProducts = ref(false)
const customizingProduct = ref<any>(null)

const sortBy = ref<string>('default')
const hideOutOfStock = ref(false)
const collapsed = ref(false)

const activeCategoryName = computed(() => {
  const cat = categories.value.find((c: any) => c.id === activeCategoryId.value)
  return cat?.name || ''
})

const isDealsCategory = computed(() =>
  activeCategoryName.value.trim().toLowerCase() === 'deals'
)

const filteredProducts = computed(() => {
  let list = products.value.slice()
  if (activeCategoryId.value) list = list.filter((p) => p.category_id === activeCategoryId.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  if (hideOutOfStock.value) list = list.filter((p) => p.is_active !== 0)
  switch (sortBy.value) {
    case 'price-asc': list.sort((a, b) => Number(a.price) - Number(b.price)); break
    case 'price-desc': list.sort((a, b) => Number(b.price) - Number(a.price)); break
    case 'name-asc': list.sort((a, b) => String(a.name).localeCompare(String(b.name))); break
    case 'name-desc': list.sort((a, b) => String(b.name).localeCompare(String(a.name))); break
    case 'newest': list.sort((a, b) => Number(b.id) - Number(a.id)); break
  }
  return list
})

const filteredDeals = computed(() => {
  let list = deals.value.filter((d: any) => d.is_active)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((d: any) => d.name.toLowerCase().includes(q))
  }
  return list
})

async function loadCategories() {
  const res = await invokeSafe<any>('menu:categories:list', false)
  if (res.ok) {
    categories.value = res.data || []
    if (categories.value.length > 0 && activeCategoryId.value === null) {
      activeCategoryId.value = categories.value[0].id
    }
  }
}

async function loadProducts() {
  loadingProducts.value = true
  const res = await invokeSafe<any>('menu:products:list', null, false)
  if (res.ok) products.value = res.data || []
  loadingProducts.value = false
}

async function loadDeals() {
  const res = await invokeSafe<any>('deals:list', false, true)
  if (res.ok) deals.value = res.data || []
}

watch(
  () => [store.currency, store.taxRate, store.taxInclusive] as const,
  () => {
    cart.loadSettings({
      taxRate: store.taxRate,
      taxInclusive: store.taxInclusive,
      currency: store.currency
    })
  },
  { immediate: true }
)

async function loadAll() {
  await loadCategories()
  await loadProducts()
  await loadDeals()
}

function selectCategory(id: number) { activeCategoryId.value = id }
function onSearch(q: string) { searchQuery.value = q }

function onProductAdd(product: any) {
  if (product.has_variants || product.has_modifiers) {
    customizingProduct.value = product
    return
  }
  cart.addProduct(product)
}

function onCustomizedAdd(payload: any) {
  cart.addProduct(payload.product, {
    variant: payload.variant,
    modifiers: payload.modifiers,
    quantity: payload.quantity,
    notes: payload.notes
  })
  customizingProduct.value = null
}

async function addDeal(deal: any) {
  const res = await invokeSafe<any>('deals:expandToCart', deal.id)
  if (res.ok) cart.addDealLines(deal, res.data || [])
}

function onCheckout() {
  if (cart.isEmpty) return
  router.push('/checkout')
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}

watch(() => menuStore.lastUpdate, async () => {
  await loadCategories()
  await loadProducts()
  await loadDeals()
})

onMounted(async () => {
  await loadAll()
})
</script>
