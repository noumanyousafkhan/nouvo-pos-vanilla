<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-lg font-bold text-nouvo-green">{{ deal.name }}</h2>
          <p class="text-[11px] text-nouvo-gray">Customize your deal</p>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-for="(item, idx) in dealItems" :key="idx" class="border border-nouvo-gray-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="text-[14px] font-bold text-nouvo-ink">
                {{ item.productName }}
                <span v-if="item.variantName" class="text-nouvo-gray font-normal">({{ item.variantName }})</span>
              </div>
              <div class="text-[11px] text-nouvo-gray mt-0.5">Quantity: {{ item.quantity }}</div>
            </div>
          </div>

          <div v-if="item.flavourModifier" class="mb-3">
            <div class="text-[12px] font-semibold text-nouvo-ink mb-2 flex items-center gap-2">
              Select Flavours
              <span class="text-nouvo-red text-[10px]">*Required</span>
              <span class="text-nouvo-gray text-[10px] ml-auto">
                Selected: {{ getFlavourCount(idx) }} / {{ item.quantity }}
              </span>
            </div>

            <div v-if="getSelectedFlavours(idx).length > 0" class="flex flex-wrap gap-1.5 mb-2">
              <div
                v-for="(sel, si) in getSelectedFlavours(idx)"
                :key="si"
                class="flex items-center gap-1.5 px-2.5 py-1.5 bg-nouvo-green/10 border border-nouvo-green rounded-lg text-[11px]"
              >
                <span class="font-semibold text-nouvo-green">{{ sel.flavourName }}</span>
                <span class="text-nouvo-gray">× {{ sel.quantity }}</span>
                <button
                  type="button"
                  class="cursor-pointer text-nouvo-red text-[11px] hover:bg-nouvo-red/10 rounded w-4 h-4 flex items-center justify-center"
                  @click="removeFlavour(idx, sel.flavourProductId)"
                >×</button>
              </div>
            </div>

            <button
              type="button"
              class="cursor-pointer w-full border-2 border-dashed border-nouvo-gray-border hover:border-nouvo-green rounded-lg py-2.5 text-[12px] font-semibold text-nouvo-gray hover:text-nouvo-green transition-colors"
              @click="openFlavourPicker(idx)"
            >
              {{ getSelectedFlavours(idx).length === 0 ? '+ Add Flavours' : '+ Add / Change Flavours' }}
            </button>
          </div>

          <div v-if="item.otherModifiers.length > 0" class="space-y-3 mt-3 pt-3 border-t border-nouvo-gray-border/60">
            <div v-for="mod in item.otherModifiers" :key="mod.id">
              <div class="text-[12px] font-semibold text-nouvo-ink mb-2 flex items-center gap-2">
                {{ mod.name }}
                <span v-if="mod.is_required" class="text-nouvo-red text-[10px]">*Required</span>
                <span v-if="mod.is_multiple" class="text-[10px] text-nouvo-gray bg-nouvo-cream px-1.5 py-0.5 rounded">Multiple</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <label
                  v-for="opt in mod.options"
                  :key="opt.id"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
                  :class="isSelected(idx, mod.id, opt.id) ? 'bg-nouvo-green/10 border-nouvo-green' : 'bg-white border-nouvo-gray-border hover:bg-nouvo-cream'"
                >
                  <input
                    :type="mod.is_multiple ? 'checkbox' : 'radio'"
                    :name="`mod_${idx}_${mod.id}`"
                    :checked="isSelected(idx, mod.id, opt.id)"
                    @change="toggleOption(idx, mod, opt)"
                    class="cursor-pointer"
                  />
                  <span class="text-[12px] flex-1">{{ opt.name }}</span>
                  <span v-if="Number(opt.price) > 0" class="text-[11px] font-semibold text-nouvo-green">+{{ Number(opt.price).toFixed(0) }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="px-6 py-4 border-t border-nouvo-gray-border space-y-3">
        <div class="space-y-1">
          <div class="flex justify-between text-[13px]">
            <span class="text-nouvo-gray">Deal Price</span>
            <span class="font-semibold text-nouvo-ink">Rs. {{ Number(deal.price).toFixed(2) }}</span>
          </div>
          <div v-if="extraAddonsTotal > 0" class="flex justify-between text-[13px]">
            <span class="text-nouvo-gray">Extra Add-ons</span>
            <span class="font-semibold text-nouvo-green">+ Rs. {{ extraAddonsTotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-[16px] font-bold text-nouvo-green pt-2 border-t border-nouvo-gray-border">
            <span>Total</span>
            <span>Rs. {{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="cursor-pointer flex-1 bg-nouvo-cream text-nouvo-ink rounded-full py-3 text-[13px] font-semibold hover:bg-nouvo-cream-dark" @click="$emit('close')">Cancel</button>
          <button
            :disabled="!canAddToCart"
            class="cursor-pointer flex-[2] bg-nouvo-green text-white rounded-full py-3 text-[13px] font-bold hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            @click="addToCart"
          >
            {{ canAddToCart ? `Add to Cart — Rs. ${grandTotal.toFixed(2)}` : 'Select Required Modifiers' }}
          </button>
        </div>
      </footer>
    </div>

    <FlavourPickerModal
      v-if="showFlavourPicker"
      :flavours="currentFlavours"
      :required="currentPickerItem?.quantity || 0"
      :selected="currentPickerSelections"
      @close="showFlavourPicker = false"
      @confirm="onFlavourConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'
import FlavourPickerModal from './FlavourPickerModal.vue'

const props = defineProps<{
  deal: any
  expandedItems: any[]
}>()

const emit = defineEmits<{ close: []; add: [any] }>()

interface FlavourSelection {
  flavourProductId: number
  flavourName: string
  quantity: number
}

interface DealItemWithModifiers {
  productId: number
  productName: string
  variantId: number | null
  variantName: string | null
  quantity: number
  normalUnitPrice: number
  flavourModifier: any | null
  otherModifiers: any[]
  selectedOptions: Record<number, number[]>
  selectedFlavours: FlavourSelection[]
  productCategoryId: number
}

const dealItems = ref<DealItemWithModifiers[]>([])
const categoryProducts = ref<Record<number, any[]>>({})

const showFlavourPicker = ref(false)
const currentPickerItemIdx = ref<number | null>(null)
const currentFlavours = ref<any[]>([])
const currentPickerSelections = ref<FlavourSelection[]>([])

const currentPickerItem = computed(() => {
  if (currentPickerItemIdx.value === null) return null
  return dealItems.value[currentPickerItemIdx.value] || null
})

const extraAddonsTotal = computed(() => {
  let total = 0
  for (const item of dealItems.value) {
    for (const mod of item.otherModifiers) {
      if (mod.is_required) continue
      const selected = item.selectedOptions[mod.id] || []
      for (const optId of selected) {
        const opt = mod.options.find((o: any) => o.id === optId)
        if (opt) total += Number(opt.price) * item.quantity
      }
    }
  }
  return total
})

const grandTotal = computed(() => Number(props.deal.price) + extraAddonsTotal.value)

const canAddToCart = computed(() => {
  for (const item of dealItems.value) {
    if (item.flavourModifier) {
      const count = getFlavourCount(dealItems.value.indexOf(item))
      if (count !== item.quantity) return false
    }
    for (const mod of item.otherModifiers) {
      if (mod.is_required) {
        const selected = item.selectedOptions[mod.id] || []
        if (selected.length === 0) return false
      }
    }
  }
  return true
})

function getFlavourCount(idx: number): number {
  const item = dealItems.value[idx]
  if (!item) return 0
  return item.selectedFlavours.reduce((s, f) => s + f.quantity, 0)
}

function getSelectedFlavours(idx: number): FlavourSelection[] {
  return dealItems.value[idx]?.selectedFlavours || []
}

function openFlavourPicker(idx: number) {
  const item = dealItems.value[idx]
  if (!item) return
  if (!item.flavourModifier) return

  const products = categoryProducts.value[item.productCategoryId] || []
  if (products.length === 0) {
    alert('No products found in this category.')
    return
  }

  currentPickerItemIdx.value = idx
  currentFlavours.value = products
  currentPickerSelections.value = [...item.selectedFlavours]
  showFlavourPicker.value = true
}

function onFlavourConfirm(selections: FlavourSelection[]) {
  if (currentPickerItemIdx.value === null) return
  const item = dealItems.value[currentPickerItemIdx.value]
  if (item) {
    item.selectedFlavours = selections
  }
  showFlavourPicker.value = false
}

function removeFlavour(idx: number, flavourProductId: number) {
  const item = dealItems.value[idx]
  if (!item) return
  item.selectedFlavours = item.selectedFlavours.filter((f) => f.flavourProductId !== flavourProductId)
}

function isSelected(itemIdx: number, modId: number, optId: number): boolean {
  const item = dealItems.value[itemIdx]
  if (!item) return false
  return (item.selectedOptions[modId] || []).includes(optId)
}

function toggleOption(itemIdx: number, mod: any, opt: any) {
  const item = dealItems.value[itemIdx]
  if (!item) return
  const current = item.selectedOptions[mod.id] || []
  if (mod.is_multiple) {
    if (current.includes(opt.id)) {
      item.selectedOptions[mod.id] = current.filter((id) => id !== opt.id)
    } else {
      item.selectedOptions[mod.id] = [...current, opt.id]
    }
  } else {
    item.selectedOptions[mod.id] = [opt.id]
  }
}

async function loadModifiersForItem(item: DealItemWithModifiers) {
  const res = await invokeSafe<any>('menu:modifiers:listByProduct', item.productId)
  if (res.ok) {
    const modifiers = (res.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      is_required: !!m.is_required,
      is_multiple: !!m.is_multiple,
      options: (m.options || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        price: Number(o.price) || 0,
        is_default: !!o.is_default
      }))
    }))

    const flavourMod = modifiers.find((m: any) => m.name.toLowerCase() === 'flavour')
    if (flavourMod) {
      item.flavourModifier = flavourMod
      item.otherModifiers = modifiers.filter((m: any) => m.id !== flavourMod.id)
    } else {
      item.flavourModifier = null
      item.otherModifiers = modifiers
    }
  }
}

async function loadCategoryProducts() {
  const catRes = await invokeSafe<any>('menu:categories:list', false)
  if (catRes.ok && catRes.data) {
    for (const cat of catRes.data) {
      const prodRes = await invokeSafe<any>('menu:products:list', cat.id, true, true)
      if (prodRes.ok && prodRes.data) {
        categoryProducts.value[cat.id] = prodRes.data.filter((p: any) => !p.is_deal_only)
      }
    }
  }
}

async function loadProductsCategoryMap(): Promise<Record<number, number>> {
  const res = await invokeSafe<any>('menu:products:list', null, true, true)
  if (res.ok && res.data) {
    const map: Record<number, number> = {}
    for (const p of res.data) {
      map[p.id] = p.category_id
    }
    return map
  }
  return {}
}

/**
 * Add deal to cart.
 * - `modifiers` = ONLY toppings/add-ons (paid)
 * - `selectedFlavours` = flavours, stored separately (free, part of deal)
 */
function addToCart() {
  if (!canAddToCart.value) return

  const cartItems = dealItems.value.map((item) => {
    // Only collect optional modifiers (toppings) — flavours go into selectedFlavours
    const modifiers: any[] = []

    for (const mod of item.otherModifiers) {
      const selected = item.selectedOptions[mod.id] || []
      for (const optId of selected) {
        const opt = mod.options.find((o: any) => o.id === optId)
        if (opt) {
          modifiers.push({
            modifierId: mod.id,
            modifierName: mod.name,
            optionId: opt.id,
            optionName: opt.name,
            price: Number(opt.price) || 0
          })
        }
      }
    }

    return {
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      quantity: item.quantity,
      modifiers,
      selectedFlavours: item.selectedFlavours
    }
  })

  emit('add', {
    deal: props.deal,
    items: cartItems,
    dealPrice: Number(props.deal.price),
    extraAddonsTotal: extraAddonsTotal.value,
    grandTotal: grandTotal.value
  })
}

onMounted(async () => {
  await loadCategoryProducts()

  const productCategoryMap = await loadProductsCategoryMap()

  dealItems.value = props.expandedItems.map((e: any) => ({
    productId: e.productId,
    productName: e.productName,
    variantId: e.variantId,
    variantName: e.variantName,
    quantity: e.quantity,
    normalUnitPrice: e.normalUnitPrice,
    flavourModifier: null,
    otherModifiers: [],
    selectedOptions: {},
    selectedFlavours: [],
    productCategoryId: productCategoryMap[e.productId] || 0
  }))

  for (const item of dealItems.value) {
    await loadModifiersForItem(item)
  }
})
</script>
