<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-lg font-bold text-nouvo-green">Select Flavours</h2>
          <p class="text-[11px] text-nouvo-gray">Total: {{ totalSelected }} / {{ required }}</p>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="px-6 pt-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search flavour..."
          class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green"
        />
      </div>

      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        <div v-if="filteredFlavours.length === 0" class="text-center text-nouvo-gray text-sm py-8">
          No flavours found
        </div>

        <div
          v-for="flavour in filteredFlavours"
          :key="flavour.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors"
          :class="getQty(flavour.id) > 0 ? 'bg-nouvo-green/10 border-nouvo-green' : 'bg-white border-nouvo-gray-border'"
        >
          <span class="flex-1 text-[13px] font-medium text-nouvo-ink truncate">{{ flavour.name }}</span>
          <div class="flex items-center gap-1 bg-nouvo-cream rounded-lg p-0.5">
            <button
              type="button"
              class="cursor-pointer w-7 h-7 rounded bg-white text-nouvo-green font-bold text-sm flex items-center justify-center hover:bg-nouvo-green hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="getQty(flavour.id) === 0"
              @click="decrement(flavour)"
            >−</button>
            <span class="min-w-[24px] text-center text-[13px] font-bold text-nouvo-green">{{ getQty(flavour.id) }}</span>
            <button
              type="button"
              class="cursor-pointer w-7 h-7 rounded bg-white text-nouvo-green font-bold text-sm flex items-center justify-center hover:bg-nouvo-green hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="totalSelected >= required"
              @click="increment(flavour)"
            >+</button>
          </div>
        </div>
      </div>

      <footer class="flex gap-2 px-6 py-4 border-t border-nouvo-gray-border">
        <button class="cursor-pointer flex-1 bg-nouvo-cream text-nouvo-ink rounded-full py-3 text-[13px] font-semibold hover:bg-nouvo-cream-dark" @click="$emit('close')">Cancel</button>
        <button
          :disabled="totalSelected !== required"
          class="cursor-pointer flex-[2] bg-nouvo-green text-white rounded-full py-3 text-[13px] font-bold hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
          @click="confirm"
        >
          Done ({{ totalSelected }} / {{ required }})
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface FlavourSelection {
  flavourProductId: number
  flavourName: string
  quantity: number
}

const props = defineProps<{
  flavours: any[]
  required: number
  selected: FlavourSelection[]
}>()

const emit = defineEmits<{ close: []; confirm: [FlavourSelection[]] }>()

const searchQuery = ref('')
const localSelections = ref<Record<number, number>>({})

const filteredFlavours = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.flavours
  return props.flavours.filter((f: any) => f.name.toLowerCase().includes(q))
})

const totalSelected = computed(() => {
  return Object.values(localSelections.value).reduce((s, v) => s + v, 0)
})

function getQty(flavourId: number): number {
  return localSelections.value[flavourId] || 0
}

function increment(flavour: any) {
  if (totalSelected.value >= props.required) return
  localSelections.value[flavour.id] = (localSelections.value[flavour.id] || 0) + 1
}

function decrement(flavour: any) {
  const current = localSelections.value[flavour.id] || 0
  if (current <= 0) return
  if (current === 1) {
    delete localSelections.value[flavour.id]
  } else {
    localSelections.value[flavour.id] = current - 1
  }
}

function confirm() {
  const selections: FlavourSelection[] = []
  for (const flavour of props.flavours) {
    const qty = localSelections.value[flavour.id] || 0
    if (qty > 0) {
      selections.push({
        flavourProductId: flavour.id,
        flavourName: flavour.name,
        quantity: qty
      })
    }
  }
  emit('confirm', selections)
}

onMounted(() => {
  for (const sel of props.selected) {
    localSelections.value[sel.flavourProductId] = sel.quantity
  }
})
</script>
