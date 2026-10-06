<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-nouvo-green/30">

      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-green/20">
        <div>
          <h2 class="text-[16px] font-bold text-nouvo-green">Order Details</h2>
          <div class="text-[12px] text-nouvo-gray font-mono">{{ fullOrder?.order?.order_number }}</div>
        </div>
        <button
          class="cursor-pointer w-9 h-9 rounded-full hover:bg-nouvo-cream flex items-center justify-center"
          @click="$emit('close')"
        >✕</button>
      </header>

      <!-- Body -->
      <div v-if="loading" class="flex-1 flex items-center justify-center text-nouvo-gray">Loading...</div>
      <div v-else class="flex-1 overflow-y-auto p-6 space-y-5">

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <div><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Invoice</span><strong class="font-mono">{{ fullOrder.order.invoice_number }}</strong></div>
          <div><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Date & Time</span><strong>{{ formatDateTime(fullOrder.order.created_at) }}</strong></div>
          <div><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Order Type</span><strong>{{ formatType(fullOrder.order.order_type) }}</strong></div>
          <div v-if="fullOrder.order.table_number"><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Table</span><strong>{{ fullOrder.order.table_number }}</strong></div>
          <div v-if="fullOrder.order.customer_name"><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Customer</span><strong>{{ fullOrder.order.customer_name }}</strong></div>
          <div v-if="fullOrder.order.customer_phone"><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Phone</span><strong>{{ fullOrder.order.customer_phone }}</strong></div>
          <div v-if="fullOrder.order.customer_address" class="col-span-2"><span class="text-nouvo-gray text-[11px] uppercase block mb-0.5">Address</span><strong>{{ fullOrder.order.customer_address }}</strong></div>
        </div>

        <!-- Items -->
        <div>
          <div class="text-[13px] font-bold text-nouvo-green uppercase tracking-wider mb-2 pt-3 border-t border-nouvo-green/20">
            Items ({{ fullOrder.items.length }})
          </div>
          <div class="space-y-2">
            <div
              v-for="item in fullOrder.items"
              :key="item.id"
              class="bg-nouvo-cream rounded-xl p-3 flex justify-between items-start gap-3"
            >
              <div class="flex-1">
                <div class="text-[13px] font-bold text-nouvo-ink">
                  {{ item.product_name }}
                  <span v-if="item.variant_name" class="font-normal text-nouvo-gray">({{ item.variant_name }})</span>
                </div>
                <div v-if="item.modifiers?.length" class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="m in item.modifiers"
                    :key="m.id"
                    class="text-[10px] bg-white text-nouvo-green px-1.5 py-0.5 rounded-full"
                  >+ {{ m.option_name }}</span>
                </div>
                <div v-if="item.notes" class="text-[11px] text-nouvo-gray italic mt-1">📝 {{ item.notes }}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-[11px] text-nouvo-gray">Rs. {{ item.unit_price.toFixed(1) }} × {{ item.quantity }}</div>
                <div class="text-[13px] font-bold text-nouvo-green">Rs. {{ item.line_total.toFixed(1) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="bg-nouvo-cream rounded-xl p-4 space-y-2">
          <div class="flex justify-between text-[13px]"><span class="text-nouvo-gray">Subtotal</span><span class="font-semibold">Rs. {{ fullOrder.order.subtotal.toFixed(1) }}</span></div>
          <div v-if="fullOrder.order.discount > 0" class="flex justify-between text-[13px]"><span class="text-nouvo-gray">Discount</span><span class="font-semibold text-nouvo-red">− Rs. {{ fullOrder.order.discount.toFixed(1) }}</span></div>
          <div v-if="fullOrder.order.tax > 0" class="flex justify-between text-[13px]"><span class="text-nouvo-gray">Tax</span><span class="font-semibold">Rs. {{ fullOrder.order.tax.toFixed(1) }}</span></div>
          <div v-if="fullOrder.order.delivery_charge > 0" class="flex justify-between text-[13px]"><span class="text-nouvo-gray">Delivery</span><span class="font-semibold">Rs. {{ fullOrder.order.delivery_charge.toFixed(1) }}</span></div>
          <div class="flex justify-between pt-2 mt-1 border-t-2 border-nouvo-green">
            <span class="text-[14px] font-bold text-nouvo-green">TOTAL</span>
            <span class="text-[16px] font-bold text-nouvo-green">Rs. {{ fullOrder.order.total.toFixed(1) }}</span>
          </div>
          <div class="flex justify-between text-[12px] pt-2">
            <span class="text-nouvo-gray">Payment</span>
            <span class="font-semibold">{{ fullOrder.order.payment_method === 'cash' ? '💵 Cash' : '💳 Card' }}</span>
          </div>
          <div v-if="fullOrder.order.payment_method === 'cash'" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Received / Change</span>
            <span class="font-semibold">Rs. {{ fullOrder.order.amount_received.toFixed(1) }} / Rs. {{ fullOrder.order.change.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Void Banner -->
        <div v-if="fullOrder.order.status === 'voided'" class="bg-nouvo-red/10 border-2 border-nouvo-red/30 text-nouvo-red rounded-xl p-3 text-center text-[13px] font-bold">
          ⚠ This order has been VOIDED
        </div>
      </div>

      <!-- Footer -->
      <footer class="flex flex-wrap gap-2 px-6 py-4 border-t border-nouvo-green/20">
        <button
          type="button"
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full px-4 py-2 text-[12px] font-bold hover:bg-nouvo-cream transition-colors"
          @click="reprint('customer')"
        >🖨 Customer</button>
        <button
          type="button"
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full px-4 py-2 text-[12px] font-bold hover:bg-nouvo-cream transition-colors"
          @click="reprint('kitchen')"
        >🍳 Kitchen</button>

        <button
          v-if="fullOrder?.order?.status !== 'voided'"
          type="button"
          class="cursor-pointer bg-nouvo-red text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-red-600 transition-colors"
          @click="showVoid = true"
        >Void Order</button>

        <button
          v-else
          type="button"
          class="cursor-pointer bg-nouvo-gold text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-yellow-600 transition-colors"
          @click="restore"
        >Restore Order</button>

        <button
          type="button"
          class="cursor-pointer bg-nouvo-green text-white rounded-full px-6 py-2 text-[12px] font-bold hover:bg-nouvo-green-dark transition-colors ml-auto"
          @click="$emit('close')"
        >Close</button>
      </footer>

      <!-- Void Confirm -->
      <div v-if="showVoid" class="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center z-10 p-4" @click.self="showVoid = false">
        <div class="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
          <div class="text-[14px] font-bold text-nouvo-red mb-1">Void Order?</div>
          <div class="text-[12px] text-nouvo-gray mb-3">This action will mark the order as voided.</div>
          <input
            v-model="voidReason"
            type="text"
            placeholder="Reason (min 3 chars)"
            class="w-full px-3 py-2 border-2 border-nouvo-red/30 rounded-xl text-[13px] outline-none focus:border-nouvo-red mb-3"
          />
          <p v-if="voidError" class="text-[12px] text-nouvo-red mb-2">{{ voidError }}</p>
          <div class="flex gap-2">
            <button type="button" class="cursor-pointer flex-1 bg-white border-2 border-nouvo-gray-border rounded-full py-2 text-[12px] font-semibold" @click="showVoid = false">Cancel</button>
            <button type="button" class="cursor-pointer flex-1 bg-nouvo-red text-white rounded-full py-2 text-[12px] font-semibold" @click="confirmVoid">Void</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ order: any }>()
const emit = defineEmits<{ close: []; updated: [] }>()

const fullOrder = ref<any>(null)
const loading = ref(true)
const showVoid = ref(false)
const voidReason = ref('')
const voidError = ref('')

async function load() {
  loading.value = true
  const res = await (window as any).nouvo.invoke('orders:get', props.order.id)
  loading.value = false
  if (res?.ok) fullOrder.value = res.data
}

async function reprint(type: 'customer' | 'kitchen') {
  await (window as any).nouvo.invoke('print:receipt', {
    orderId: props.order.id,
    type,
    isReprint: true
  })
}

async function confirmVoid() {
  voidError.value = ''
  if (voidReason.value.trim().length < 3) {
    voidError.value = 'Reason must be at least 3 characters'
    return
  }
  const res = await (window as any).nouvo.invoke('orders:void', {
    orderId: props.order.id,
    reason: voidReason.value.trim()
  })
  if (res?.ok) {
    showVoid.value = false
    emit('updated')
  } else {
    voidError.value = res?.error?.message || 'Void failed'
  }
}

async function restore() {
  const res = await (window as any).nouvo.invoke('orders:restore', props.order.id)
  if (res?.ok) emit('updated')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatType(t: string) {
  if (t === 'dine_in') return 'Dine-In'
  if (t === 'takeaway') return 'Takeaway'
  if (t === 'delivery') return 'Delivery'
  return t
}

onMounted(load)
</script>
