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
            Size (variant) fix karein — flavour/modifiers customer POS pe select karega.
          </p>

          <div class="space-y-2">
            <div v-for="(item, i) in form.items" :key="i" class="flex items-center gap-2">
              <select
                v-model.number="item.product_id"
                class="flex-1 px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green bg-white"
                @change="onProductChange(item)"
              >
                <option :value="null">-- Select Product --</option>
                <option v-for="p in dealAvailableProducts" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>

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
            <div v-else-if="Number(form.price) > normalTotal" class="text-nouvo-red font-semibold text-xs">
              ⚠ Deal price is higher than normal total!
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
const allCategories = ref<any[]>([])
const productVariants = ref<Record<number, any[]>>({})
const saving = ref(false)
const error = ref('')

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
  return allProducts.value.filter((p: any) => {
    const cat = allCategories.value.find((c: any) => c.id === p.category_id)
    const catName = String(cat?.name || '').trim().toLowerCase()
    if (catName === 'pizza') {
      return String(p.name).trim().toLowerCase() === 'pizza'
    }
    return true
  })
})

const normalTotal = computed(() => {
  return form.value.items.reduce((sum, item) => {
    let price = Number(item.unitPrice) || 0
    if (item.variant_id) {
      const variants = productVariants.value[item.product_id] || []
      const v = variants.find((x: any) => x.id === item.variant_id)
      if (v) price += Number(v.price_adjust) || 0
    }
    return sum + price * (Number(item.quantity) || 1)
  }, 0)
})

async function loadCategories() {
  const res = await invokeSafe<any>('menu:categories:list', true)
  if (res.ok) allCategories.value = res.data || []
}

async function loadProducts() {
  // includeInactive=true, includeDealOnly=true → so "Pizza" base product is included
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

function onProductChange(item: any) {
  item.variant_id = null
  const p = allProducts.value.find((x: any) => x.id === item.product_id)
  item.unitPrice = p ? Number(p.price) : 0
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

onMounted(async () => {
  await loadCategories()
  await loadProducts()
  if (props.dealId) await loadDeal()
  else if (props.duplicateFrom) await loadDuplicate()
})
</script>
