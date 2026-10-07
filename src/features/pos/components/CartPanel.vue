<template>
  <div class="bg-white rounded-2xl h-full flex flex-col p-5 overflow-hidden">
    <!-- Header — green button toggles fullscreen -->
    <header class="flex items-center gap-3 pb-4">
      <button
        type="button"
        class="cursor-pointer w-9 h-9 rounded-full bg-nouvo-green text-white flex items-center justify-center shrink-0 hover:bg-nouvo-green-dark transition-colors"
        :title="collapsed ? 'Show cart' : 'Fullscreen (hide cart)'"
        @click="$emit('toggle-collapse')"
      >
        <svg
          v-if="!collapsed"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <svg
          v-else
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      <div class="flex-1 min-w-0">
        <div class="text-[13px] font-bold text-nouvo-ink leading-tight">Purchase Receipt</div>
        <div class="text-[11px] text-nouvo-gray font-medium">#{{ receiptNumber }}</div>
      </div>
      <button
        v-if="!cart.isEmpty"
        class="cursor-pointer w-8 h-8 rounded-full hover:bg-nouvo-red/10 text-nouvo-red flex items-center justify-center"
        @click="clearCart"
        title="Clear cart"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        </svg>
      </button>
    </header>

    <div class="h-px bg-nouvo-gray-border/60 mb-4"></div>

    <div class="flex gap-2 mb-4">
      <button
        v-for="t in orderTypes"
        :key="t.value"
        class="cursor-pointer px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
        :class="cart.orderType === t.value ? 'bg-nouvo-green text-white' : 'bg-white text-nouvo-gray border border-nouvo-gray-border hover:text-nouvo-green'"
        @click="cart.setOrderType(t.value as any)"
      >{{ t.label }}</button>
    </div>

    <div class="grid grid-cols-2 gap-2.5 mb-4">
      <div>
        <label class="block text-[10px] text-nouvo-gray mb-1">Customer name</label>
        <input v-model="cart.customerName" type="text" placeholder="Name" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-[12px] outline-none focus:border-nouvo-green" />
      </div>
      <div>
        <label class="block text-[10px] text-nouvo-gray mb-1">Table</label>
        <input v-model="cart.tableNumber" type="text" placeholder="B12 - Indoor" class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-[12px] outline-none focus:border-nouvo-green" />
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col mb-3">
      <div class="text-[12px] font-semibold text-nouvo-ink mb-2">Order list</div>
      <div v-if="!cart.isEmpty" class="flex-1 overflow-y-auto -mr-2 pr-2">
        <CartItemRow v-for="item in cart.items" :key="item.id" :item="item" />
      </div>
      <div v-else class="flex-1 flex flex-col items-center justify-center text-nouvo-gray">
        <div class="text-[36px] opacity-25 mb-2">🛒</div>
        <div class="text-[12px] font-semibold">Cart is empty</div>
        <div class="text-[11px] mt-0.5">Click products to add</div>
      </div>
    </div>

    <div v-if="!cart.isEmpty" class="pt-3 border-t border-nouvo-gray-border/60">
      <div class="text-[12px] font-semibold text-nouvo-ink mb-2">Payment Details</div>
      <div class="flex justify-between items-center py-1 text-[12px]">
        <span class="text-nouvo-gray">Subtotal</span>
        <span class="font-semibold text-nouvo-ink">{{ store.currency }} {{ cart.subtotal.toFixed(1) }}</span>
      </div>
      <div class="flex justify-between items-center py-1 text-[12px]">
        <span class="text-nouvo-gray">Discount</span>
        <input
          :value="cart.discount ?? ''"
          type="text"
          inputmode="decimal"
          placeholder="0"
          class="w-[90px] px-2.5 py-1 border border-nouvo-gray-border rounded-lg text-[12px] text-right outline-none text-nouvo-ink font-semibold bg-white focus:border-nouvo-green focus:ring-2 focus:ring-nouvo-green/20 transition-all"
          @input="onDiscountInput"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </div>
      <div v-if="cart.taxAmount > 0" class="flex justify-between items-center py-1 text-[12px]">
        <span class="text-nouvo-gray">{{ store.business.tax_label }} ({{ store.taxRate }}%)</span>
        <span class="font-semibold text-nouvo-ink">{{ store.currency }} {{ cart.taxAmount.toFixed(1) }}</span>
      </div>
      <div class="flex justify-between items-center py-1 text-[12px]">
        <span class="text-nouvo-gray">Total</span>
        <span class="font-bold text-nouvo-ink">{{ store.currency }} {{ cart.total.toFixed(1) }}</span>
      </div>
    </div>

    <button
      :disabled="cart.isEmpty"
      class="cursor-pointer mt-4 bg-nouvo-green text-white border-none rounded-full h-12 px-2 flex items-center gap-3 transition-all hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
      @click="$emit('checkout')"
    >
      <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#025726" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      <span class="text-[13px] font-bold flex-1 text-left">Place Order</span>
      <span class="text-[14px] font-bold text-white">{{ store.currency }} {{ cart.total.toFixed(1) }}</span>
      <div class="w-8 h-8 flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import CartItemRow from './CartItemRow.vue'

defineProps<{ collapsed?: boolean }>()
defineEmits<{ checkout: []; 'toggle-collapse': [] }>()
const cart = useCartStore()
const store = useSettingsStore()
const receiptNumber = ref('0001')

const orderTypes = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Take Away' },
  { value: 'delivery', label: 'Delivery' }
]

function onDiscountInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  if (v === '') {
    cart.setDiscount(null)
    return
  }
  const cleaned = v.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) {
    cart.setDiscount(null)
  } else {
    cart.setDiscount(num)
  }
}

function clearCart() {
  if (confirm('Clear cart?')) cart.clearCart()
}

onMounted(async () => {
  const res = await (window as any).nouvo.invoke('orders:previewNextNumbers')
  if (res?.ok && res.data?.orderNumber) {
    const match = String(res.data.orderNumber).match(/(\d+)$/)
    if (match) receiptNumber.value = match[1]
  }
})
</script>
