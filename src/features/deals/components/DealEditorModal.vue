<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-lg font-bold text-nouvo-green">
            {{ dealId ? 'Edit' : duplicateFrom ? 'Duplicate Deal' : 'New' }} Deal
          </h2>
          <p v-if="duplicateFrom" class="text-[11px] text-nouvo-gray mt-0.5">
            Copying from: {{ duplicateFrom.name }}
          </p>
        </div>
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

          <p v-if="form.items.length === 0" class="text-xs text-nouvo-gray mb-3">
            Add at least one product to this deal.
          </p>

          <div class="space-y-2">
            <div v-for="(item, i) in form.items" :key="i" class="flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  v-model="item.productSearch"
                  type="text"
                  placeholder="Search product..."
                  class="w-full px-3 py-2 pr-8 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green bg-white"
                  @focus="openDropdown = i"
                  @input="openDropdown = i"
                  @blur="closeDropdownDelayed"
                />
                <span v-if="item.product_id" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-nouvo-green text-xs font-bold pointer-events-none">✓</span>

                <div
                  v-if="openDropdown === i && filteredProducts(item.productSearch).length > 0"
                  class="absolute z-30 left-0 right-0 mt-1 bg-white border border-nouvo-gray-border rounded-lg shadow-lg max-h-56 overflow-y-auto"
                >
                  <div
                    v-for="p in filteredProducts(item.productSearch)"
                    :key="p.id"
                    class="px-3 py-2 hover:bg-nouvo-cream cursor-pointer text-sm flex justify-between items-center"
                    @mousedown.prevent="selectProduct(item, p)"
                  >
                    <span class="font-medium text-nouvo-ink truncate">{{ p.name }}</span>
                    <span class="text-nouvo-gray text-xs ml-2 shrink-0">Rs. {{ Number(p.price).toFixed(2) }}</span>
                  </div>
                </div>
                <div
                  v-else-if="openDropdown === i && item.productSearch && filteredProducts(item.productSearch).length === 0"
                  class="absolute z-30 left-0 right-0 mt-1 bg-white border border-nouvo-gray-border rounded-lg shadow-lg px-3 py-3 text-sm text-nouvo-gray"
                >
                  No products found
                </div>
              </div>

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

          <div v-if="form.items.length > 0 && form.items.every((i: any) => i.product_id)" class="mt-4 p-3 bg-nouvo-cream rounded-lg text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-nouvo-gray">Normal Total:</span>
              <span class="font-semibold text-nouvo-ink">Rs. {{ normalTotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-nouvo-gray">Deal Price:</span>
              <span class="font-semibold text-nouvo-ink">Rs. {{ Number(form.price).toFixed(2) }}</span>
            </div>
            <div v-if="Number(form.price) < normalTotal" class="flex justify-between">
              <span class="text-nouvo-green font-semibold">Customer saves:</span>
              <span class="font-bold text-nouvo-green">Rs. {{ (normalTotal - Number(form.price)).toFixed(2) }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'

const props = defineProps<{
  dealId?: number | null
  duplicateFrom?: any | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const allProducts = ref<any[]>([])
const saving = ref(false)
const error = ref('')
const openDropdown = ref<number | null>(null)

const form = ref({
  name: '',
  price: 0,
  image_path: '',
  is_active: true,
  valid_from: '' as string,
  valid_to: '' as string,
  items: [] as any[]
})

const normalTotal = computed(() => {
  return form.value.items.reduce((sum, item) => {
    return sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)
  }, 0)
})

async function loadProducts() {
  const res = await invokeSafe<any>('menu:products:list', null, false)
  if (res.ok) allProducts.value = res.data || []
}

function filteredProducts(query: string): any[] {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return allProducts.value.slice(0, 30)
  return allProducts.value.filter((p: any) => p.name.toLowerCase().includes(q)).slice(0, 30)
}

function closeDropdownDelayed() {
  setTimeout(() => { openDropdown.value = null }, 150)
}

function selectProduct(item: any, product: any) {
  item.product_id = product.id
  item.productName = product.name
  item.unitPrice = Number(product.price) || 0
  item.productSearch = product.name
  openDropdown.value = null
}

function addItem() {
  form.value.items.push({
    product_id: null,
    productName: '',
    productSearch: '',
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
          productName: p ? p.name : `Product #${i.product_id}`,
          productSearch: p ? p.name : '',
          unitPrice: p ? Number(p.price) : 0,
          quantity: Number(i.quantity) || 1
        }
      })
    }
  }
}

async function loadDuplicate() {
  if (!props.duplicateFrom) return
  const src = props.duplicateFrom
  const res = await invokeSafe<any>('deals:getFull', src.id)
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
          productName: p ? p.name : `Product #${i.product_id}`,
          productSearch: p ? p.name : '',
          unitPrice: p ? Number(p.price) : 0,
          quantity: Number(i.quantity) || 1
        }
      })
    }
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
      variant_id: null,
      quantity: Number(i.quantity) || 1
    }))
  }

  let res
  if (props.dealId) {
    res = await invokeSafe<any>('deals:update', props.dealId, {
      name: payload.name,
      price: payload.price,
      image_path: payload.image_path,
      is_active: payload.is_active,
      valid_from: payload.valid_from,
      valid_to: payload.valid_to
    })
    if (res.ok) {
      res = await invokeSafe<any>('deals:replaceItems', props.dealId, payload.items)
    }
  } else {
    res = await invokeSafe<any>('deals:create', payload)
  }

  saving.value = false
  if (res.ok) emit('saved')
  else error.value = (res as any).error?.message || 'Save failed'
}

onMounted(async () => {
  await loadProducts()
  if (props.dealId) {
    await loadDeal()
  } else if (props.duplicateFrom) {
    await loadDuplicate()
  }
})
</script>
