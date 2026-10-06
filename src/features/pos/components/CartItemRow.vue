<template>
  <div class="py-3 border-b border-nouvo-cream last:border-b-0">
    <!-- ================= DEAL ITEM ================= -->
    <div v-if="item.type === 'deal'" class="flex gap-3 items-start">
      <!-- Deal icon -->
      <div class="w-11 h-11 bg-nouvo-gold/20 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        <img
          v-if="item.image_path"
          :src="fileUrl(item.image_path)"
          class="max-w-full max-h-full object-contain"
          loading="lazy"
        />
        <span v-else class="text-xl text-nouvo-gold">⭐</span>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Top row: Name + Total + Remove -->
        <div class="flex justify-between items-start gap-2">
          <div class="text-[13px] font-bold text-nouvo-gold leading-tight flex-1 min-w-0">
            {{ item.dealName || item.productName }}
          </div>
          <div class="text-[13px] font-bold text-nouvo-gold whitespace-nowrap">
            {{ cart.currency }} {{ item.lineTotal.toFixed(2) }}
          </div>
          <button
            class="cursor-pointer text-nouvo-gray hover:text-nouvo-red text-xs shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-nouvo-red/10 transition-colors"
            @click="cart.removeItem(item.id)"
            title="Remove deal"
          >✕</button>
        </div>

        <!-- Children: deal ke items (indented, no prices) -->
        <div class="mt-1.5 space-y-0.5">
          <div
            v-for="(child, i) in item.dealItems"
            :key="i"
            class="text-[11px] text-nouvo-gray flex items-center gap-1"
          >
            <span class="text-nouvo-green">+</span>
            <span class="truncate">
              {{ child.productName }}<span v-if="child.variantName"> ({{ child.variantName }})</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= PRODUCT ITEM ================= -->
    <div v-else class="flex gap-3 items-start">
      <div class="w-11 h-11 bg-nouvo-cream rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        <img
          v-if="item.image_path"
          :src="fileUrl(item.image_path)"
          class="max-w-full max-h-full object-contain"
          loading="lazy"
        />
        <span v-else class="text-xl opacity-70">{{ getEmoji(item.productName) }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start gap-2">
          <div class="text-[13px] font-semibold text-nouvo-ink leading-tight flex-1 min-w-0">
            {{ item.productName }}
          </div>
          <button
            class="cursor-pointer text-nouvo-gray hover:text-nouvo-red text-xs shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-nouvo-red/10 transition-colors"
            @click="cart.removeItem(item.id)"
            title="Remove"
          >✕</button>
        </div>

        <!-- Variant + Modifiers -->
        <div v-if="item.variantName || item.modifiers.length > 0" class="flex flex-wrap gap-1 mt-1.5">
          <span
            v-if="item.variantName"
            class="inline-flex items-center gap-1 text-[10px] bg-nouvo-cream text-nouvo-green px-1.5 py-0.5 rounded font-medium"
          >
            {{ item.variantName }}
          </span>
          <span
            v-for="m in item.modifiers"
            :key="m.optionId"
            class="inline-flex items-center gap-1 text-[10px] bg-nouvo-cream text-nouvo-green px-1.5 py-0.5 rounded font-medium"
          >
            + {{ m.optionName }}
          </span>
        </div>

        <!-- Notes -->
        <div v-if="item.notes" class="text-[11px] text-nouvo-gray italic mt-1 flex items-center gap-1">
          <span>📝</span><span>{{ item.notes }}</span>
        </div>

        <!-- Qty + Price -->
        <div class="flex justify-between items-center mt-2">
          <div class="flex items-center gap-1 bg-nouvo-cream rounded-lg p-0.5">
            <button
              class="cursor-pointer w-6 h-6 border-none bg-white rounded text-nouvo-green font-bold text-sm flex items-center justify-center hover:bg-nouvo-green hover:text-white transition-colors"
              @click="cart.decrementQty(item.id)"
            >−</button>
            <span class="min-w-[22px] text-center text-[12px] font-bold text-nouvo-green">{{ item.quantity }}</span>
            <button
              class="cursor-pointer w-6 h-6 border-none bg-white rounded text-nouvo-green font-bold text-sm flex items-center justify-center hover:bg-nouvo-green hover:text-white transition-colors"
              @click="cart.incrementQty(item.id)"
            >+</button>
          </div>
          <div class="text-right leading-none">
            <div class="text-[10px] text-nouvo-gray mb-0.5">
              {{ cart.currency }} {{ item.unitPrice.toFixed(2) }} × {{ item.quantity }}
            </div>
            <div class="text-[14px] font-bold text-nouvo-green">
              {{ cart.currency }} {{ item.lineTotal.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const props = defineProps<{ item: any }>()
const cart = useCartStore()

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
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///'
  return `${prefix}${normalized}`
}
</script>
