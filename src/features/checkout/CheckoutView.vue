<template>
  <div class="min-h-screen bg-nouvo-cream">
    <!-- Top bar -->
    <header class="bg-white border-b border-nouvo-gray-border px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="cursor-pointer w-10 h-10 rounded-full bg-white border border-nouvo-gray-border flex items-center justify-center hover:bg-nouvo-cream transition-colors" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="text-[20px] font-bold text-nouvo-ink">Checkout</h1>
      </div>
      <div class="text-[12px] text-nouvo-gray">
        Order # <span class="font-mono font-semibold text-nouvo-ink">{{ previewNumbers?.orderNumber || '—' }}</span>
      </div>
    </header>

    <!-- Main content -->
    <div class="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      <!-- LEFT — Order Summary -->
      <div class="space-y-4">
        <OrderSummaryPanel />
      </div>

      <!-- RIGHT — Payment -->
      <div class="bg-white rounded-2xl border border-nouvo-gray-border p-5 space-y-4">
        <h2 class="text-[15px] font-bold text-nouvo-ink">Payment</h2>

        <!-- Payment method -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="m in paymentMethods"
            :key="m.value"
            class="cursor-pointer py-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all"
            :class="paymentMethod === m.value
              ? 'border-nouvo-green bg-nouvo-green text-white'
              : 'border-nouvo-gray-border bg-white text-nouvo-ink hover:border-nouvo-green'"
            @click="paymentMethod = m.value"
          >
            <span class="text-[22px]">{{ m.icon }}</span>
            <span class="text-[12px] font-bold">{{ m.label }}</span>
          </button>
        </div>

        <!-- Totals -->
        <div class="pt-4 border-t border-nouvo-gray-border/60 space-y-1.5">
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Subtotal</span>
            <span class="font-semibold text-nouvo-ink">{{ cart.currency }} {{ cart.subtotal.toFixed(1) }}</span>
          </div>
          <div v-if="(cart.discount ?? 0) > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Discount</span>
            <span class="font-semibold text-nouvo-red">− {{ cart.currency }} {{ (cart.discount ?? 0).toFixed(1) }}</span>
          </div>
          <div v-if="cart.taxAmount > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Tax</span>
            <span class="font-semibold text-nouvo-ink">{{ cart.currency }} {{ cart.taxAmount.toFixed(1) }}</span>
          </div>
          <div v-if="(cart.deliveryCharge ?? 0) > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Delivery</span>
            <span class="font-semibold text-nouvo-ink">{{ cart.currency }} {{ (cart.deliveryCharge ?? 0).toFixed(1) }}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-nouvo-gray-border/60">
            <span class="text-[15px] font-bold text-nouvo-ink">TOTAL</span>
            <span class="text-[20px] font-bold text-nouvo-green">{{ cart.currency }} {{ cart.total.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Cash amount -->
        <div v-if="paymentMethod === 'cash'" class="space-y-2">
          <label class="text-[11px] font-semibold text-nouvo-gray uppercase tracking-wide">Amount Received</label>
          <input
            v-model.number="amountReceived"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.0"
            class="w-full px-4 py-3.5 border-2 border-nouvo-green/30 rounded-2xl text-[22px] font-bold text-nouvo-green outline-none focus:border-nouvo-green transition-colors"
            @keydown.enter="placeOrder"
          />
          <div class="grid grid-cols-4 gap-2">
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.round(cart.total * 10) / 10">Exact</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 100) * 100">Round 100</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 500) * 500">Round 500</button>
            <button class="cursor-pointer py-2.5 bg-nouvo-cream rounded-xl text-[11px] font-semibold text-nouvo-green hover:bg-nouvo-green hover:text-white transition-colors" @click="amountReceived = Math.ceil(cart.total / 1000) * 1000">Round 1000</button>
          </div>
          <div class="flex justify-between items-center py-3 px-4 bg-nouvo-cream rounded-2xl">
            <span class="text-[13px] font-semibold text-nouvo-gray">Change</span>
            <span class="text-[18px] font-bold text-nouvo-green">{{ cart.currency }} {{ changeAmount.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-[12px] text-nouvo-red bg-nouvo-red/10 px-3 py-2 rounded-xl">
          {{ error }}
        </div>

        <!-- Confirm -->
        <button
          :disabled="!canPlaceOrder || checkout.submitting"
          class="cursor-pointer w-full h-[52px] bg-nouvo-green text-white border-none rounded-full text-[14px] font-bold transition-all hover:bg-nouvo-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
          @click="placeOrder"
        >
          {{ checkout.submitting ? 'Placing Order...' : 'Confirm Order' }}
        </button>
      </div>
    </div>

    <!-- Success modal -->
    <div v-if="showSuccess && lastOrder" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-nouvo-green flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 class="text-[22px] font-bold text-nouvo-ink mb-1">Order Placed!</h2>
        <p class="text-[12px] text-nouvo-gray mb-5">Order has been successfully recorded</p>

        <div class="bg-nouvo-cream rounded-2xl p-4 space-y-2 text-left mb-5">
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Order #</span>
            <span class="font-mono font-bold text-nouvo-ink">{{ lastOrder.order_number }}</span>
          </div>
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Invoice #</span>
            <span class="font-mono font-bold text-nouvo-ink">{{ lastOrder.invoice_number }}</span>
          </div>
          <div class="flex justify-between text-[12px] border-t border-nouvo-gray-border/60 pt-2">
            <span class="text-nouvo-gray">Total</span>
            <span class="font-bold text-nouvo-ink">{{ lastOrder.total.toFixed(1) }}</span>
          </div>
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Change</span>
            <span class="font-bold text-nouvo-ink">{{ (lastOrder.change || 0).toFixed(1) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <button class="cursor-pointer py-3 rounded-full border border-nouvo-gray-border text-[12px] font-semibold hover:bg-nouvo-cream" @click="onReprint('customer')">
            🧾 Customer
          </button>
          <button class="cursor-pointer py-3 rounded-full border border-nouvo-gray-border text-[12px] font-semibold hover:bg-nouvo-cream" @click="onReprint('kitchen')">
            👨‍🍳 Kitchen
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button class="cursor-pointer py-3 rounded-full bg-nouvo-cream text-[12px] font-semibold hover:bg-nouvo-gray-border" @click="closeSuccess">
            Close
          </button>
          <button class="cursor-pointer py-3 rounded-full bg-nouvo-green text-white text-[12px] font-bold hover:bg-nouvo-green-dark" @click="onNewOrder">
            New Order
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt preview -->
    <ReceiptPreviewModal
      v-if="previewText"
      :text="previewText"
      :lines="previewLines"
      :type="previewType"
      @close="closePreview"
      @print="onPrintNow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'
import OrderSummaryPanel from './components/OrderSummaryPanel.vue'
import ReceiptPreviewModal from './components/ReceiptPreviewModal.vue'

const invokeSafe = async <T = any>(channel: string, payload?: any): Promise<{ ok: boolean; data?: T; error?: any }> => {
  try {
    const res = await (window as any).nouvo.invoke(channel, payload)
    return res
  } catch (err: any) {
    return { ok: false, error: { message: err?.message || 'IPC failed' } }
  }
}

const router = useRouter()
const cart = useCartStore()
const checkout = useCheckoutStore()

const paymentMethod = ref<'cash' | 'card'>('cash')
const amountReceived = ref<number>(0)
const error = ref('')
const showSuccess = ref(false)
const lastOrder = ref<any>(null)
const lastOrderId = ref<number | null>(null)
const previewText = ref<string | null>(null)
const previewLines = ref<any[] | null>(null)
const previewType = ref<'customer' | 'kitchen'>('customer')
const previewNumbers = ref<any>(null)

const paymentMethods: Array<{ value: 'cash' | 'card'; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' }
]

const changeAmount = computed(() => {
  if (paymentMethod.value !== 'cash') return 0
  const diff = Number(amountReceived.value || 0) - cart.total
  return diff > 0 ? diff : 0
})

const canPlaceOrder = computed(() => {
  if (cart.isEmpty) return false
  if (paymentMethod.value === 'cash' && amountReceived.value < cart.total) return false
  return true
})

function goBack() { router.push('/pos') }

async function loadPreview() {
  const res = await invokeSafe<any>('orders:previewNextNumbers')
  if (res.ok) previewNumbers.value = res.data
}

function generateIdempotencyKey(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function placeOrder() {
  if (!canPlaceOrder.value || checkout.submitting) return
  error.value = ''
  const payload = cart.exportForCheckout()

  // Delivery validation
  if (payload.orderType === 'delivery') {
    const digits = (payload.customerPhone || '').replace(/[^0-9]/g, '')
    if (!payload.customerName?.trim()) {
      error.value = 'Customer name required for delivery'
      return
    }
    if (digits.length < 12) {
      error.value = 'Valid phone number required (min 12 digits)'
      return
    }
    if (!payload.customerAddress?.trim()) {
      error.value = 'Delivery address required'
      return
    }
  }

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
    if (res?.order?.id) {
      lastOrderId.value = res.order.id
      lastOrder.value = res.order
      showSuccess.value = true
    }
  } catch (err: any) {
    error.value = err.message || 'Order failed'
  }
}

function closeSuccess() {
  showSuccess.value = false
  error.value = ''
}

function onNewOrder() {
  showSuccess.value = false
  lastOrder.value = null
  lastOrderId.value = null
  cart.clearCart()
  checkout.reset()
  amountReceived.value = 0
  error.value = ''
  router.push('/pos')
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
    previewLines.value = (res.data as any).lines || null
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
}

function closePreview() {
  previewText.value = null
  previewLines.value = null
}

onMounted(async () => {
  amountReceived.value = Math.round(cart.total * 10) / 10
  await loadPreview()
})
</script>
