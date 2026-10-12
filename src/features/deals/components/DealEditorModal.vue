<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <h2 class="text-lg font-bold text-nouvo-green">{{ dealId ? 'Edit' : 'New' }} Deal</h2>
        <button type="button" class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <h3 class="text-sm font-bold text-nouvo-green mb-3">Deal Info</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Deal Name <span class="text-nouvo-red">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Family Feast" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Deal Price <span class="text-nouvo-red">*</span></label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" v-model="form.is_active" class="cursor-pointer" />
                <span>Active</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Valid From (optional)</label>
              <input v-model="form.valid_from" type="date" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Valid To (optional)</label>
              <input v-model="form.valid_to" type="date" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green" />
            </div>
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-nouvo-green">Deal Components</h3>
            <button type="button" class="cursor-pointer bg-nouvo-cream text-nouvo-green px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-nouvo-cream-dark" @click="addItem">+ Add Product</button>
          </div>

          <p class="text-[11px] text-nouvo-gray mb-3">
            Type to search products. Fix the size (variant) here. Customer will select flavour/modifiers at POS.
          </p>

          <div class="space-y-2">
            <div v-for="(item, i) in form.items" :key="i" class="flex items-center gap-2">
              <div class="flex-1 relative" @click.stop>
                <input
                  type="text"
                  v-model="productSearch[i]"
                  placeholder="Search product..."
                  class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green bg-white"
                  @focus="openDropdown(i)"
                  @input="onSearchInput(i)"
                  @keydown.esc="dropdownOpen[i] = false"
                />
                <div
                  v-if="dropdownOpen[i]"
                  class="absolute left-0 right-0 bottom-full mb-1 bg-white border border-nouvo-gray-border rounded-lg shadow-lg max-h-52 overflow-y-auto z-50"
                >
                  <div
                    v-for="p in filteredProductsFor(i)"
                    :key="p.id"
                    class="px-3 py-2 text-sm cursor-pointer hover:bg-nouvo-cream"
                    :class="{ 'bg-nouvo-cream font-semibold': item.product_id === p.id }"
                    @click="selectProduct(i, p)"
                  >
                    {{ p.name }}
                  </div>
                  <div v-if="filteredProductsFor(i).length === 0" class="px-3 py-2 text-sm text-nouvo-gray text-center">
                    No products found
                  </div>
                </div>
              </div>

              <select
                v-if="item.product_id && getVariants(item.product_id).length > 0"
                v-model.number="item.variant_id"
                class="w-32 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green bg-white"
              >
                <option :value="null">Size…</option>
                <option v-for="v in getVariants(item.product_id)" :key="v.id" :value="v.id">
                  {{ v.name }}
                </option>
              </select>

              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                class="w-16 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green text-center"
              />

              <button
                type="button"
                class="cursor-pointer w-9 h-9 rounded-lg hover:bg-nouvo-red/10 text-nouvo-red text-sm"
                @click="form.items.splice(i, 1)"
              >✕</button>
            </div>
          </div>
        </section>

        <p v-if="error" class="text-[12px] text-nouvo-red bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>
      </div>

      <footer class="flex justify-end gap-2 px-6 py-4 border-t border-nouvo-gray-border">
        <button type="button" class="cursor-pointer bg-nouvo-cream text-nouvo-ink px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-cream-dark" @click="$emit('close')">Cancel</button>
        <button type="button" :disabled="saving" class="cursor-pointer bg-nouvo-green text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark disabled:opacity-50 disabled:cursor-not-allowed" @click="save">
          {{ saving ? 'Saving...' : 'Save Deal' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { invokeSafe } from '@/utils/ipc'

const props = defineProps<{
  dealId?: number | null
  duplicateFrom?: any | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const allProducts = ref<any[]>([])
const allCategories = ref<any[]>([])
const productVariants = ref<Record<number, any[]>>({})
const saving = ref(false)
const error = ref('')

const productSearch = ref<Record<number, string>>({})
const dropdownOpen = ref<Record<number, boolean>>({})

const form = ref({
  name: '',
  price: 0,
  image_path: '',
  is_active: true,
  valid_from: '' as string,
  valid_to: '' as string,
  items: [] as any[]
})

const dealAvailableProducts = computed(() => {
  const pizzaCat = allCategories.value.find((c: any) =>
    String(c.name || '').trim().toLowerCase() === 'pizza'
  )
  const pizzaCatId = pizzaCat?.id

  return allProducts.value
    .filter((p: any) => {
      if (pizzaCatId && p.category_id === pizzaCatId) {
        return p.is_deal_only === 1
      }
      return true
    })
    .sort((a: any, b: any) => {
      if (a.is_deal_only === 1 && b.is_deal_only !== 1) return -1
      if (a.is_deal_only !== 1 && b.is_deal_only === 1) return 1
      return String(a.name).localeCompare(String(b.name))
    })
})

async function loadCategories() {
  const res = await invokeSafe<any>('menu:categories:list', true)
  if (res.ok) allCategories.value = res.data || []
}

async function loadProducts() {
  const res = await invokeSafe<any>('menu:products:list', null, true, true)
  if (res.ok) {
    allProducts.value = res.data || []
    for (const p of allProducts.value) {
      const v = await invokeSafe<any>('menu:variants:listByProduct', p.id)
      if (v.ok) productVariants.value[p.id] = v.data || []
    }
  }
}

function getVariants(productId: number): any[] {
  return productVariants.value[productId] || []
}

function openDropdown(idx: number) {
  for (const key in dropdownOpen.value) {
    if (Number(key) !== idx) dropdownOpen.value[Number(key)] = false
  }
  dropdownOpen.value[idx] = true
  const item = form.value.items[idx]
  if (item?.product_id) {
    const p = allProducts.value.find((x: any) => x.id === item.product_id)
    if (p) productSearch.value[idx] = p.name
  }
}

function onSearchInput(idx: number) {
  dropdownOpen.value[idx] = true
}

function filteredProductsFor(idx: number): any[] {
  const q = String(productSearch.value[idx] || '').trim().toLowerCase()
  if (!q) return dealAvailableProducts.value

  const item = form.value.items[idx]
  if (item?.product_id) {
    const selected = allProducts.value.find((x: any) => x.id === item.product_id)
    if (selected && selected.name.toLowerCase() === q) {
      return dealAvailableProducts.value
    }
  }

  return dealAvailableProducts.value.filter((p: any) =>
    String(p.name).toLowerCase().includes(q)
  )
}

function selectProduct(idx: number, p: any) {
  const item = form.value.items[idx]
  if (!item) return
  item.product_id = p.id
  item.variant_id = null
  item.unitPrice = Number(p.price) || 0
  productSearch.value[idx] = p.name
  dropdownOpen.value[idx] = false
}

function addItem() {
  form.value.items.push({
    product_id: null,
    variant_id: null,
    unitPrice: 0,
    quantity: 1
  })
}

async function loadDeal() {
  if (!props.dealId) return
  const res = await invokeSafe<any>('deals:getFull', props.dealId)
  if (res.ok && res.data) {
    const d = res.data.deal
    form.value = {
      name: d.name || '',
      price: Number(d.price) || 0,
      image_path: d.image_path || '',
      is_active: !!d.is_active,
      valid_from: d.valid_from || '',
      valid_to: d.valid_to || '',
      items: (res.data.items || []).map((i: any) => {
        const p = allProducts.value.find((x: any) => x.id === i.product_id)
        return {
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          unitPrice: p ? Number(p.price) : 0,
          quantity: Number(i.quantity) || 1
        }
      })
    }
    form.value.items.forEach((item, idx) => {
      const p = allProducts.value.find((x: any) => x.id === item.product_id)
      if (p) productSearch.value[idx] = p.name
    })
  }
}

async function loadDuplicate() {
  if (!props.duplicateFrom) return
  const res = await invokeSafe<any>('deals:getFull', props.duplicateFrom.id)
  if (res.ok && res.data) {
    const d = res.data.deal
    form.value = {
      name: `${d.name} (Copy)`,
      price: Number(d.price) || 0,
      image_path: d.image_path || '',
      is_active: true,
      valid_from: d.valid_from || '',
      valid_to: d.valid_to || '',
      items: (res.data.items || []).map((i: any) => {
        const p = allProducts.value.find((x: any) => x.id === i.product_id)
        return {
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          unitPrice: p ? Number(p.price) : 0,
          quantity: Number(i.quantity) || 1
        }
      })
    }
    form.value.items.forEach((item, idx) => {
      const p = allProducts.value.find((x: any) => x.id === item.product_id)
      if (p) productSearch.value[idx] = p.name
    })
  }
}

async function save() {
  if (!form.value.name.trim()) { error.value = 'Name required'; return }
  if (form.value.items.length === 0) { error.value = 'Add at least one product'; return }
  if (form.value.items.some((i: any) => !i.product_id)) { error.value = 'All items must have a product'; return }

  saving.value = true
  error.value = ''

  const payload = {
    name: String(form.value.name).trim(),
    price: Number(form.value.price) || 0,
    image_path: String(form.value.image_path || ''),
    is_active: !!form.value.is_active,
    valid_from: form.value.valid_from || null,
    valid_to: form.value.valid_to || null,
    items: form.value.items.map((i: any) => ({
      product_id: Number(i.product_id),
      variant_id: i.variant_id ? Number(i.variant_id) : null,
      quantity: Number(i.quantity) || 1
    }))
  }

  let res
  if (props.dealId) {
    res = await invokeSafe<any>('deals:updateFull', props.dealId, payload)
  } else {
    res = await invokeSafe<any>('deals:create', payload)
  }

  saving.value = false
  if (res.ok) emit('saved')
  else error.value = (res as any).error?.message || 'Save failed'
}

function closeAllDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    for (const key in dropdownOpen.value) {
      dropdownOpen.value[Number(key)] = false
    }
  }
}

onMounted(async () => {
  await loadCategories()
  await loadProducts()
  if (props.dealId) await loadDeal()
  else if (props.duplicateFrom) await loadDuplicate()

  document.addEventListener('click', closeAllDropdowns)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAllDropdowns)
})
</script>
