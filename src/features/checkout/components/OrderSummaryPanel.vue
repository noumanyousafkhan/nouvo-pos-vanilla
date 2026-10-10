<template>
  <div class="bg-white rounded-3xl border-2 border-nouvo-green/30 p-6">
    <h2 class="text-[16px] font-bold text-nouvo-green mb-5">Order Summary</h2>

    <div class="space-y-3">
      <div v-for="item in cart.items" :key="item.id" class="flex gap-3 items-start pb-3 border-b border-nouvo-green/15 last:border-b-0">
        <div class="w-12 h-12 bg-nouvo-cream rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="item.image_path" :src="fileUrl(item.image_path)" class="max-w-full max-h-full object-contain" />
          <span v-else class="text-2xl">{{ getEmoji(item.productName) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[14px] font-bold text-nouvo-ink mb-0.5">
            {{ item.productName }}
            <span v-if="item.dealName" class="inline-block bg-nouvo-yellow text-nouvo-green text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase">{{ item.dealName }}</span>
          </div>
          <div v-if="item.type === 'deal'" class="mt-1 space-y-0.5">
            <div v-for="(child, i) in item.dealItems" :key="i" class="text-[11px] text-nouvo-gray flex items-center gap-1">
              <span class="text-nouvo-green">+</span>
              <span>{{ child.productName }}<span v-if="child.variantName"> ({{ child.variantName }})</span></span>
            </div>
          </div>
          <div v-else class="text-[11px] text-nouvo-gray mb-1">
            {{ store.currency }} {{ item.unitPrice.toFixed(1) }} × {{ item.quantity }}
            <span v-if="item.variantName" class="ml-1">- {{ item.variantName }}</span>
          </div>
          <div v-if="item.type !== 'deal' && item.modifiers.length > 0" class="flex flex-wrap gap-1">
            <span v-for="m in item.modifiers" :key="m.optionId" class="text-[10px] text-nouvo-gray bg-nouvo-cream px-2 py-0.5 rounded-full">+ {{ m.optionName }}</span>
          </div>
          <div v-if="item.type !== 'deal' && item.notes" class="text-[10px] text-nouvo-gray italic mt-1">📝 {{ item.notes }}</div>
        </div>
        <div class="text-[14px] font-bold text-nouvo-green shrink-0">{{ store.currency }} {{ item.lineTotal.toFixed(1) }}</div>
      </div>
    </div>

    <div class="mt-5 pt-5 border-t-2 border-nouvo-green/20 space-y-1">
      <div class="flex justify-between text-[13px]">
        <span class="text-nouvo-gray">Order Type</span>
        <span class="font-semibold text-nouvo-ink">{{ orderTypeLabel }}</span>
      </div>
      <div v-if="cart.tableNumber" class="flex justify-between text-[13px]">
        <span class="text-nouvo-gray">Table</span>
        <span class="font-semibold text-nouvo-ink">{{ cart.tableNumber }}</span>
      </div>
      <div v-if="cart.customerName" class="flex justify-between text-[13px]">
        <span class="text-nouvo-gray">Customer</span>
        <span class="font-semibold text-nouvo-ink">{{ cart.customerName }}</span>
      </div>
      <div v-if="cart.customerPhone" class="flex justify-between text-[13px]">
        <span class="text-nouvo-gray">Phone</span>
        <span class="font-semibold text-nouvo-ink">{{ cart.customerPhone }}</span>
      </div>
      <div v-if="cart.customerAddress" class="flex justify-between text-[13px]">
        <span class="text-nouvo-gray">Address</span>
        <span class="font-semibold text-nouvo-ink text-right max-w-[200px]">{{ cart.customerAddress }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'

const cart = useCartStore()
const store = useSettingsStore()

const orderTypeLabel = computed(() => {
  const t = cart.orderType
  if (t === 'dine_in') return 'Dine In'
  if (t === 'takeaway') return 'Takeaway'
  return 'Delivery'
})

const EMOJI_MAP: Array<[RegExp, string]> = [
  [/pizza/i, '🍕'], [/burger|zinger/i, '🍔'], [/wrap|shawarma|roll/i, '🌯'],
  [/fries|chips/i, '🍟'], [/drink|cola|soda|water|juice/i, '🥤'],
  [/coffee|espresso|latte|cappuccino/i, '☕'], [/tea|chai/i, '🍵'],
  [/cake|brownie|dessert/i, '🍰'], [/ice.?cream/i, '🍦'], [/salad/i, '🥗'],
  [/nugget|wing/i, '🍗'], [/bread|toast/i, '🍞']
]

function getEmoji(name: string): string {
  for (const [re, emoji] of EMOJI_MAP) if (re.test(name)) return emoji
  return '🍽'
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  // using nouvo-file protocol
  return `nouvo-file:///${normalized}`
}
</script>
