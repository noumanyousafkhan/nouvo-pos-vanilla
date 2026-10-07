<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-lg font-bold text-nouvo-ink">Order Details</h2>
          <p class="text-[11px] text-nouvo-gray font-mono mt-0.5">{{ order.order_number }}</p>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray flex items-center justify-center" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Invoice</div>
            <div class="text-[13px] font-mono font-semibold text-nouvo-ink">{{ order.invoice_number }}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Date & Time</div>
            <div class="text-[13px] font-semibold text-nouvo-ink">{{ formatDateTime(order.created_at) }}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Order Type</div>
            <div class="text-[13px] font-semibold text-nouvo-ink">{{ formatType(order.order_type) }}</div>
          </div>
          <div v-if="order.table_number">
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Table</div>
            <div class="text-[13px] font-semibold text-nouvo-ink">{{ order.table_number }}</div>
          </div>
          <div v-if="order.customer_name">
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Customer</div>
            <div class="text-[13px] font-semibold text-nouvo-ink">{{ order.customer_name }}</div>
          </div>
          <div v-if="order.customer_phone">
            <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Phone</div>
            <div class="text-[13px] font-semibold text-nouvo-ink">{{ order.customer_phone }}</div>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider mb-2">
            Items ({{ items.length }})
          </div>
          <div class="space-y-2">
            <div v-for="item in items" :key="item.id" class="bg-nouvo-cream rounded-xl p-3 flex justify-between items-start gap-3">
              <div class="flex-1">
                <div class="text-[13px] font-semibold text-nouvo-ink">
                  {{ item.product_name }}
                  <span v-if="item.variant_name" class="text-nouvo-gray font-normal">({{ item.variant_name }})</span>
                </div>
                <div v-if="item.modifiers && item.modifiers.length" class="mt-1 space-y-0.5">
                  <div v-for="(m, i) in item.modifiers" :key="i" class="text-[11px] text-nouvo-gray flex items-center gap-1">
                    <span class="text-nouvo-green">+</span>
                    <span>{{ m.option_name }}</span>
                  </div>
                </div>
              </div>
              <div class="text-[13px] font-bold text-nouvo-green whitespace-nowrap">×{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <div class="bg-nouvo-cream rounded-xl p-4 space-y-1.5">
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Subtotal</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.subtotal).toFixed(2) }}</span>
          </div>
          <div v-if="order.discount > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Discount</span>
            <span class="font-semibold text-nouvo-red">− {{ currency }} {{ Number(order.discount).toFixed(2) }}</span>
          </div>
          <div v-if="order.tax > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Tax</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.tax).toFixed(2) }}</span>
          </div>
          <div v-if="order.delivery_charge > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Delivery</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.delivery_charge).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-[15px] font-bold text-nouvo-green pt-2 mt-1 border-t-2 border-nouvo-green">
            <span>TOTAL</span>
            <span>{{ currency }} {{ Number(order.total).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-[12px] pt-2 mt-1 border-t border-nouvo-green/20">
            <span class="text-nouvo-gray">Payment: {{ String(order.payment_method || '').toUpperCase() }}</span>
            <span class="text-nouvo-gray">Received / Change: {{ Number(order.amount_received).toFixed(2) }} / {{ Number(order.change).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <footer class="flex gap-2 px-6 py-4 border-t border-nouvo-gray-border">
        <button
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full px-4 py-2.5 text-[12px] font-bold hover:bg-nouvo-cream transition-colors flex items-center justify-center gap-1.5"
          @click="reprint('customer')"
        >
          🖨 Customer
        </button>
        <button
          class="cursor-pointer bg-white border-2 border-nouvo-green/30 text-nouvo-green rounded-full px-4 py-2.5 text-[12px] font-bold hover:bg-nouvo-cream transition-colors flex items-center justify-center gap-1.5"
          @click="reprint('kitchen')"
        >
          🍳 Kitchen
        </button>
        <div class="flex-1"></div>
        <button
          v-if="order.status !== 'voided'"
          class="cursor-pointer bg-nouvo-red text-white rounded-full px-5 py-2.5 text-[12px] font-bold hover:opacity-90 transition-opacity"
          @click="showVoid = true"
        >
          Void Order
        </button>
      </footer>
    </div>

    <ReceiptPreviewModal
      v-if="previewText"
      :text="previewText"
      :type="previewType"
      @close="previewText = null"
      @print="onPrintNow"
    />

    <div v-if="showVoid" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-nouvo-red mb-2">Void Order</h3>
        <p class="text-[12px] text-nouvo-gray mb-4">This will mark the order as voided. Reason required.</p>
        <textarea
          v-model="voidReason"
          rows="3"
          placeholder="Reason (min 3 characters)"
          class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-[13px] outline-none focus:border-nouvo-red"
        ></textarea>
        <p v-if="voidError" class="mt-2 text-[12px] text-nouvo-red">{{ voidError }}</p>
        <div class="flex gap-2 mt-4">
          <button class="cursor-pointer flex-1 bg-nouvo-cream text-nouvo-ink rounded-full py-2 text-[13px] font-semibold" @click="showVoid = false">Cancel</button>
          <button class="cursor-pointer flex-1 bg-nouvo-red text-white rounded-full py-2 text-[13px] font-bold" @click="confirmVoid">Void</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'
import { useSettingsStore } from '@/stores/settings'
import ReceiptPreviewModal from '@/features/checkout/components/ReceiptPreviewModal.vue'

const props = defineProps<{ order: any }>()
const emit = defineEmits<{ close: []; updated: [] }>()

const store = useSettingsStore()
const items = ref<any[]>([])
const currency = ref('Rs.')

const showVoid = ref(false)
const voidReason = ref('')
const voidError = ref('')

const previewText = ref<string | null>(null)
const previewType = ref<'customer' | 'kitchen'>('customer')

async function load() {
  currency.value = store.currency
  const res = await invokeSafe<any>('orders:get', props.order.id)
  if (res.ok && res.data) {
    items.value = res.data.items || []
  }
}

/**
 * Reprint click → PREVIEW only (no actual print).
 */
async function reprint(type: 'customer' | 'kitchen') {
  const res = await invokeSafe<any>('print:preview', {
    orderId: props.order.id,
    type,
    copies: 1,
    isReprint: true
  })
  if (res.ok && (res.data as any)?.preview) {
    previewText.value = (res.data as any).preview
    previewType.value = type
  } else if (res.ok) {
    previewText.value = '[No preview available]'
    previewType.value = type
  } else {
    alert('Preview failed: ' + ((res as any).error?.message || 'Unknown'))
  }
}

/**
 * Print click in preview modal → actual print.
 */
async function onPrintNow() {
  if (!previewText.value) return
  await invokeSafe<any>('print:receipt', {
    orderId: props.order.id,
    type: previewType.value,
    copies: 1,
    isReprint: true
  })
  previewText.value = null
}

async function confirmVoid() {
  voidError.value = ''
  if (voidReason.value.trim().length < 3) {
    voidError.value = 'Reason must be at least 3 characters'
    return
  }
  const res = await invokeSafe<any>('orders:void', {
    orderId: props.order.id,
    reason: voidReason.value.trim()
  })
  if (res.ok) {
    showVoid.value = false
    emit('updated')
  } else {
    voidError.value = (res as any).error?.message || 'Void failed'
  }
}

async function restore() {
  const res = await invokeSafe<any>('orders:restore', props.order.id)
  if (res.ok) emit('updated')
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
