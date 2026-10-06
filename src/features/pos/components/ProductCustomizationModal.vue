<template>
  <div
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-card shadow-card-hover w-full max-w-xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <h2 class="text-lg font-bold text-nouvo-green m-0">{{ product.name }}</h2>
        <button class="cursor-pointer text-lg text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-5 space-y-6">
        <section v-if="variants.length > 0">
          <h3 class="text-sm font-semibold text-nouvo-green mb-2.5">Choose Size / Variant</h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
            <button
              v-for="v in variants"
              :key="v.id"
              class="cursor-pointer bg-nouvo-cream border-2 rounded-xl p-2.5 text-[13px] font-medium flex flex-col items-start gap-0.5 transition-all"
              :class="selectedVariantId === v.id ? 'bg-nouvo-green text-white border-nouvo-green' : 'border-transparent hover:border-nouvo-green'"
              @click="selectedVariantId = v.id"
            >
              <span>{{ v.name }}</span>
              <span v-if="v.price_adjust !== 0" class="text-[11px] opacity-75">
                {{ v.price_adjust > 0 ? '+' : '' }}{{ currency }} {{ Math.abs(v.price_adjust).toFixed(2) }}
              </span>
            </button>
          </div>
        </section>

        <section v-for="mod in modifiers" :key="mod.id">
          <h3 class="text-sm font-semibold text-nouvo-green mb-2.5 flex items-center gap-2">
            {{ mod.name }}
            <span v-if="mod.is_required" class="text-nouvo-red">*</span>
            <span class="text-[10px] bg-nouvo-cream text-nouvo-gray px-1.5 py-0.5 rounded ml-auto font-medium">
              {{ mod.is_multiple ? 'Multiple' : 'Single' }}
            </span>
          </h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
            <button
              v-for="opt in mod.options"
              :key="opt.id"
              class="cursor-pointer bg-nouvo-cream border-2 rounded-xl p-2.5 text-[13px] font-medium flex flex-col items-start gap-0.5 transition-all"
              :class="isSelected(mod.id, opt.id) ? 'bg-nouvo-green text-white border-nouvo-green' : 'border-transparent hover:border-nouvo-green'"
              @click="toggleOption(mod, opt)"
            >
              <span>{{ opt.name }}</span>
              <span v-if="opt.price > 0" class="text-[11px] opacity-75">
                +{{ currency }} {{ opt.price.toFixed(2) }}
              </span>
            </button>
          </div>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-nouvo-green mb-2.5">Quantity</h3>
          <div class="flex items-center gap-4">
            <button
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream text-nouvo-green font-bold text-lg hover:bg-nouvo-green hover:text-white"
              @click="quantity = Math.max(1, quantity - 1)"
            >−</button>
            <span class="text-lg font-bold text-nouvo-green min-w-[30px] text-center">{{ quantity }}</span>
            <button
              class="cursor-pointer w-9 h-9 rounded-lg bg-nouvo-cream text-nouvo-green font-bold text-lg hover:bg-nouvo-green hover:text-white"
              @click="quantity++"
            >+</button>
          </div>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-nouvo-green mb-2.5">Notes (optional)</h3>
          <input
            v-model="notes"
            type="text"
            placeholder="e.g. Less sugar, No onions"
            class="w-full px-3 py-2.5 border border-nouvo-gray-border rounded-lg text-[13px] outline-none focus:border-nouvo-green"
          />
        </section>
      </div>

      <footer class="flex justify-between items-center px-6 py-4 border-t border-nouvo-gray-border gap-3">
        <div class="flex flex-col">
          <span class="text-[11px] text-nouvo-gray">Total</span>
          <span class="text-xl font-bold text-nouvo-green">{{ currency }} {{ totalPrice.toFixed(2) }}</span>
        </div>
        <button
          :disabled="!canAdd"
          class="cursor-pointer bg-nouvo-green text-white border-none rounded-button px-6 py-3 text-sm font-semibold hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
          @click="addToCart"
        >Add to Cart</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ product: any }>()
const emit = defineEmits<{ close: []; add: [any] }>()

const variants = ref<any[]>([])
const modifiers = ref<any[]>([])
const currency = ref('Rs.')

const selectedVariantId = ref<number | null>(null)
const selectedOptions = ref<Record<number, number[]>>({})
const quantity = ref(1)
const notes = ref('')

const selectedVariant = computed(() =>
  variants.value.find((v) => v.id === selectedVariantId.value) ?? null
)

const selectedModifiersList = computed(() => {
  const result: any[] = []
  for (const mod of modifiers.value) {
    const optIds = selectedOptions.value[mod.id] ?? []
    for (const optId of optIds) {
      const opt = mod.options.find((o: any) => o.id === optId)
      if (opt) result.push({
        modifierId: mod.id, modifierName: mod.name,
        optionId: opt.id, optionName: opt.name, price: opt.price
      })
    }
  }
  return result
})

const unitPrice = computed(() => {
  let p = props.product.price
  if (selectedVariant.value) p += selectedVariant.value.price_adjust || 0
  for (const m of selectedModifiersList.value) p += m.price
  return p
})

const totalPrice = computed(() => unitPrice.value * quantity.value)

const canAdd = computed(() => {
  for (const mod of modifiers.value) {
    if (mod.is_required) {
      const sel = selectedOptions.value[mod.id] ?? []
      if (sel.length === 0) return false
    }
  }
  return true
})

function isSelected(modId: number, optId: number): boolean {
  return (selectedOptions.value[modId] ?? []).includes(optId)
}

function toggleOption(mod: any, opt: any) {
  const current = selectedOptions.value[mod.id] ?? []
  if (mod.is_multiple) {
    selectedOptions.value[mod.id] = current.includes(opt.id)
      ? current.filter((id) => id !== opt.id)
      : [...current, opt.id]
  } else {
    selectedOptions.value[mod.id] = current.includes(opt.id) ? [] : [opt.id]
  }
}

async function loadDetails() {
  const v = await (window as any).nouvo.invoke('menu:variants:listByProduct', props.product.id)
  if (v?.ok) {
    variants.value = v.data
    const def = v.data.find((x: any) => x.is_default)
    if (def) selectedVariantId.value = def.id
  }

  const m = await (window as any).nouvo.invoke('menu:modifiers:listByProduct', props.product.id)
  if (m?.ok) {
    modifiers.value = m.data
    for (const mod of m.data) {
      const defs = mod.options.filter((o: any) => o.is_default).map((o: any) => o.id)
      if (defs.length > 0) selectedOptions.value[mod.id] = defs
    }
  }
}

function addToCart() {
  emit('add', {
    product: props.product,
    variant: selectedVariant.value,
    modifiers: selectedModifiersList.value,
    quantity: quantity.value,
    notes: notes.value
  })
}

onMounted(async () => {
  const s = await (window as any).nouvo.invoke('settings:getBusiness')
  if (s?.ok) currency.value = s.data.currency_symbol
  await loadDetails()
})
</script>
