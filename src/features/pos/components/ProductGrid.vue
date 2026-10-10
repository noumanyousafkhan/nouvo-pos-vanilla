<template>
  <div class="grid grid-cols-4 gap-4">
    <div
      v-for="product in products"
      :key="product.id"
      class="cursor-pointer bg-white rounded-2xl p-3 border-2 border-transparent hover:border-nouvo-green hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col relative group"
      @click="$emit('add', product)"
    >
      <div class="h-[130px] bg-nouvo-cream rounded-xl flex items-center justify-center mb-3 overflow-hidden relative">
        <img
          v-if="product.image_path"
          :src="fileUrl(product.image_path)"
          class="max-w-full max-h-full object-contain"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="text-[52px] opacity-80">{{ getEmoji(product.name) }}</div>
        <div
          v-if="!product.is_active"
          class="absolute top-2 right-2 bg-nouvo-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        >OFF</div>
      </div>
      <div class="flex-1 min-h-[48px]">
        <div class="text-[13px] font-semibold text-nouvo-ink mb-1 line-clamp-2 leading-tight">{{ product.name }}</div>
        <div class="text-[14px] font-bold text-nouvo-green">{{ store.currency }} {{ Number(product.price).toFixed(2) }}</div>
      </div>
      <button
        class="cursor-pointer absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white border-2 border-nouvo-green text-nouvo-green text-xl font-semibold flex items-center justify-center transition-colors group-hover:bg-nouvo-green group-hover:text-white"
        @click.stop="$emit('add', product)"
      >+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  products: any[]
  categoryName?: string
}>()
defineEmits<{ add: [any] }>()

const store = useSettingsStore()

/**
 * Category-based emoji — overrides keyword-based matching.
 * Example: "Drinks" category → always 🥤 regardless of product name.
 */
const CATEGORY_EMOJI: Array<[RegExp, string]> = [
  [/drink|beverage|shake|juice|soda|cola|water/i, '🥤'],
  [/pizza/i, '🍕'],
  [/burger|zinger|sandwich/i, '🍔'],
  [/wrap|shawarma|roll/i, '🌯'],
  [/side|fries|chips|nugget|wing/i, '🍟'],
  [/dessert|cake|brownie|sweet|ice.?cream|muffin/i, '🍰'],
  [/coffee|espresso|latte|cappuccino|macchiato|americano|mocha/i, '☕'],
  [/tea|chai|jasmine|earl|chamomile/i, '🍵'],
  [/salad/i, '🥗']
]

/**
 * Product-name based fallback (used when category doesn't match anything).
 */
const PRODUCT_EMOJI: Array<[RegExp, string]> = [
  [/cola|coke|pepsi|sprite|7up|fanta|mirinda|dew|soda|drink|water|juice|shake|smoothie|lime/i, '🥤'],
  [/coffee|espresso|latte|cappuccino|macchiato|americano|mocha/i, '☕'],
  [/tea|chai|jasmine|earl|chamomile/i, '🍵'],
  [/pizza/i, '🍕'],
  [/burger|zinger/i, '🍔'],
  [/wrap|shawarma|roll/i, '🌯'],
  [/fries|chips/i, '🍟'],
  [/nugget|wing/i, '🍗'],
  [/cake|brownie|dessert|muffin|macaroon/i, '🍰'],
  [/ice.?cream/i, '🍦'],
  [/salad/i, '🥗'],
  [/bread|toast/i, '🍞']
]

function getEmoji(name: string): string {
  const trimmedName = String(name || '').trim()

  // 1. Try category first (highest priority)
  if (props.categoryName) {
    for (const [re, emoji] of CATEGORY_EMOJI) {
      if (re.test(props.categoryName)) return emoji
    }
  }

  // 2. Try product name
  for (const [re, emoji] of PRODUCT_EMOJI) {
    if (re.test(trimmedName)) return emoji
  }

  // 3. Fallback
  return '🍽'
}

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  // using nouvo-file protocol
  return `nouvo-file:///${normalized}`
}
</script>
