<template>
  <div class="h-screen bg-nouvo-cream flex flex-col overflow-hidden">
    <header class="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
      <div class="flex items-center gap-4">
        <button class="cursor-pointer w-10 h-10 rounded-full bg-white border border-nouvo-gray-border flex items-center justify-center hover:bg-nouvo-cream transition-colors" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 class="text-xl font-bold text-nouvo-green">Checkout</h1>
      </div>

      <div v-if="previewNumbers" class="text-[13px] text-nouvo-gray">
        Order # <span class="font-mono font-semibold text-nouvo-ink">{{ previewNumbers.orderNumber }}</span>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-[1fr_420px] gap-5 px-8 pb-6 overflow-hidden">
      <div class="overflow-y-auto pr-1 min-h-0">
        <OrderSummaryPanel />
      </div>

      <div class="bg-white rounded-3xl border-2 border-nouvo-green/30 flex flex-col p-5 overflow-hidden">
        <h2 class="text-[16px] font-bold text-nouvo-green mb-4">Payment</h2>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <button
            v-for="m in paymentMethods"
            :key="m.value"
            class="cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-1.5 transition-all"
            :class="paymentMethod === m.value ? 'bg-nouvo-green text-white border-nouvo-green' : 'bg-white text-nouvo-ink border-nouvo-gray-border hover:border-nouvo-green'"
            @click="paymentMethod = m.value"
          >
            <span class="text-2xl">{{ m.icon }}</span>
            <span class="text-[13px] font-semibold">{{ m.label }}</span>
          </button>
        </div>

        <div class="border-t-2 border-nouvo-green/20 border-b-2 border-b-nouvo-green/20 py-4 mb-5">
          <div class="flex justify-between items-center py-1.5 text-[13px]">
            <span class="text-nouvo-gray">Subtotal</span>
            <span class="font-semibold text-nouvo-ink">{{ store.currency }} {{ cart.subtotal.toFixed(1) }}</span>
          </div>
          <div v-if="cart.discountValue > 0" class="flex justify-between items-center py-1.5 text-[13px]">
            <span class="text-nouvo-gray">Discount</span>
            <span class="font-semibold text-nouvo-red">− {{ store.currency }} {{ cart.discountValue.toFixed(1) }}</span>
          </div>
          <div v-if="cart.taxAmount > 0" class="flex justify-between items-center py-1.5 text-[13px]">
            <span class="text-nouvo-gray">{{ store.business.tax_label }}</span>
            <span class="font-semibold text-nouvo-ink">{{ store.currency }} {{ cart.taxAmount.toFixed(1) }}</span>
          </div>
          <div v-if="cart.deliveryValue > 0" class="flex justify-between items-center py-1.5 text-[13px]">
            <span class="text-nouvo-gray">Delivery</span>
            <span class="font-semibold text-nouvo-ink">{{ store.currency }} {{ cart.deliveryValue.toFixed(1) }}</span>
          </div>
          <div class="flex justify-between items-center pt-3 mt-1 border-t-2 border-nouvo-green">
            <span class="text-[15px] font-bold text-nouvo-green">TOTAL</span>
            <span class="text-[18px] font-bold text-nouvo-green">{{ store.currency }} {{ cart.total.toFixed(1) }}</span>
          </div>
        </div>

        <div v-if="paymentMethod === 'cash'" class="flex-1 flex flex-col">
          <label class="block text-[12px] font-semibold text-nouvo-gray uppercase tracking-wider mb-2">Amount Received</label>
          <input v-model.number="amountReceived" type="number" min="0" step="0.01" placeholder="0.0" class="w-full px-4 py-3.5 border-2 border-nouvo-green/30 rounded-2xl text-[22px] font-bold text-nouvo-green outline-none focus:border-nouvo-green transition-colors" @keydown.enter="placeOrder" />

          <div class="grid grid-cols-4 gap-2 mt-3">
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.round(cart.total * 10) / 10">Exact</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 100) * 100">Round 100</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 500) * 500">Round 500</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 1000) * 1000">Round 1000</button>
          </div>

          <div class="flex justify-between items-center mt-4 px-4 py-3.5 rounded-2xl font-semibold" :class="change < 0 ? 'bg-red-50 text-nouvo-red' : 'bg-nouvo-green/10 text-nouvo-green'">
            <span>Change</span>
            <span class="text-[18px] font-bold">{{ store.currency }} {{ change.toFixed(1) }}</span>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-nouvo-gray text-[13px]">
          Card payment — no amount needed
        </div>

        <p v-if="error" class="mt-3 text-[12px] text-nouvo-red bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

        <button :disabled="!canPlaceOrder || checkout.submitting" class="cursor-pointer mt-4 bg-nouvo-green text-white border-none rounded-full h-[52px] px-6 text-[14px] font-bold transition-all hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed" @click="placeOrder">
          {{ checkout.submitting ? 'Placing Order...' : 'Confirm Order' }}
        </button>
      </div>
    </div>

    <CheckoutSuccessModal
      v-if="checkout.lastOrder"
      :order="checkout.lastOrder"
      @close="onSuccessClose"
      @new-order="onNewOrder"
      @reprint="onReprint"
    />

    <ReceiptPreviewModal
      v-if="previewText"
      :text="previewText"
      :type="previewType"
      @close="previewText = null"
      @print="onPrintNow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'
import { useSettingsStore } from '@/stores/settings'
import { invokeSafe } from '@/utils/ipc'
import OrderSummaryPanel from './components/OrderSummaryPanel.vue'
import CheckoutSuccessModal from './components/CheckoutSuccessModal.vue'
import ReceiptPreviewModal from './components/ReceiptPreviewModal.vue'

const router = useRouter()
const cart = useCartStore()
const checkout = useCheckoutStore()
const store = useSettingsStore()

const paymentMethod = ref<'cash' | 'card'>('cash')
const amountReceived = ref<number>(0)
const error = ref('')
const previewNumbers = ref<any>(null)

const previewText = ref<string | null>(null)
const previewType = ref<'customer' | 'kitchen'>('customer')
const lastOrderId = ref<number | null>(null)

const paymentMethods: Array<{ value: 'cash' | 'card'; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' }
]

const change = computed(() => {
  if (paymentMethod.value !== 'cash') return 0
  return amountReceived.value - cart.total
})

const canPlaceOrder = computed(() => {
  if (cart.isEmpty) return false
  if (paymentMethod.value === 'cash') return amountReceived.value >= cart.total
  return true
})

function generateIdempotencyKey(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function loadPreview() {
  const res = await invokeSafe<any>('orders:previewNextNumbers')
  if (res.ok) previewNumbers.value = res.data
}

function goBack() { router.push('/pos') }

async function placeOrder() {
  if (!canPlaceOrder.value || checkout.submitting) return
  error.value = ''
  const payload = cart.exportForCheckout()
  const orderData = {
    orderType: String(payload.orderType || 'takeaway'),
    customerName: String(payload.customerName || ''),
    customerPhone: String(payload.customerPhone || ''),
    customerAddress: String(payload.customerAddress || ''),
    tableNumber: String(payload.tableNumber || ''),
    items: payload.items,
    subtotal: Number(payload.subtotal) || 0,
    discount: Number(payload.discount) || 0,
    deliveryCharge: Number(payload.deliveryCharge) || 0,
    tax: Number(payload.taxAmount) || 0,
    total: Number(payload.total) || 0,
    paymentMethod: paymentMethod.value,
    amountReceived: paymentMethod.value === 'cash' ? Number(amountReceived.value) || 0 : Number(payload.total) || 0,
    notes: String(payload.notes || ''),
    idempotencyKey: generateIdempotencyKey()
  }
  const cleanPayload = JSON.parse(JSON.stringify(orderData))
  try {
    const res = await checkout.createOrder(cleanPayload)
    if (res?.order?.id) lastOrderId.value = res.order.id
  } catch (err: any) {
    error.value = err.message || 'Order failed'
  }
}

async function onReprint(type: string) {
  if (!lastOrderId.value) return
  const res = await invokeSafe<any>('print:preview', {
    orderId: lastOrderId.value,
    type: type,
    copies: 1,
    isReprint: false
  })
  if (res.ok && (res.data as any)?.preview) {
    previewText.value = (res.data as any).preview
    previewType.value = type === 'kitchen' ? 'kitchen' : 'customer'
  } else {
    alert('Preview failed: ' + ((res as any).error?.message || 'Unknown'))
  }
}

async function onPrintNow() {
  if (!lastOrderId.value) return
  await invokeSafe<any>('print:receipt', {
    orderId: lastOrderId.value,
    type: previewType.value,
    copies: 1,
    isReprint: true
  })
  previewText.value = null
}

function onSuccessClose() {
  cart.clearCart()
  checkout.reset()
  lastOrderId.value = null
  router.push('/pos')
}

function onNewOrder() {
  cart.clearCart()
  checkout.reset()
  lastOrderId.value = null
  router.push('/pos')
}

onMounted(async () => {
  if (cart.isEmpty) { router.push('/pos'); return }
  amountReceived.value = cart.total
  await loadPreview()
})
</script>
