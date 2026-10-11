<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
      <header class="flex items-center justify-between px-6 py-4 border-b border-nouvo-gray-border">
        <div>
          <h2 class="text-[16px] font-bold text-nouvo-ink">Order Details</h2>
          <p class="text-[11px] text-nouvo-gray font-mono">{{ order.order_number }}</p>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray flex items-center justify-center" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-nouvo-cream rounded-xl p-3">
            <div class="text-[10px] text-nouvo-gray font-bold uppercase tracking-wide mb-1">Invoice</div>
            <div class="text-[12px] font-mono font-bold text-nouvo-ink">{{ order.invoice_number }}</div>
          </div>
          <div class="bg-nouvo-cream rounded-xl p-3">
            <div class="text-[10px] text-nouvo-gray font-bold uppercase tracking-wide mb-1">Order Type</div>
            <div class="text-[12px] font-bold text-nouvo-ink capitalize">{{ order.order_type.replace('_', '-') }}</div>
          </div>
        </div>

        <div v-if="order.customer_name || order.customer_phone || order.table_number" class="bg-nouvo-cream rounded-xl p-3 space-y-1.5">
          <div v-if="order.customer_name" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Customer</span>
            <span class="font-semibold text-nouvo-ink">{{ order.customer_name }}</span>
          </div>
          <div v-if="order.customer_phone" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Phone</span>
            <span class="font-semibold text-nouvo-ink">{{ order.customer_phone }}</span>
          </div>
          <div v-if="order.customer_address" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Address</span>
            <span class="font-semibold text-nouvo-ink text-right">{{ order.customer_address }}</span>
          </div>
          <div v-if="order.table_number" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Table</span>
            <span class="font-semibold text-nouvo-ink">{{ order.table_number }}</span>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wide mb-2">
            Items ({{ items.length }})
          </div>
          <div class="space-y-2">
            <div v-for="item in items" :key="item.id" class="bg-nouvo-cream rounded-xl p-3">
              <div class="flex justify-between items-start gap-3">
                <div class="flex-1 min-w-0">
                  <div class="text-[12px] font-bold text-nouvo-ink">
                    {{ item.product_name }}
                    <span v-if="item.variant_name" class="text-nouvo-gray font-normal">({{ item.variant_name }})</span>
                  </div>
                  <div v-if="item.modifiers && item.modifiers.length" class="text-[11px] text-nouvo-gray mt-1">
                    {{ item.modifiers.map((m: any) => m.option_name).join(', ') }}
                  </div>
                  <div class="text-[11px] text-nouvo-gray mt-0.5">
                    {{ currency }} {{ Number(item.unit_price).toFixed(1) }} × {{ item.quantity }}
                  </div>
                </div>
                <div class="text-[12px] font-bold text-nouvo-green shrink-0">
                  {{ currency }} {{ Number(item.line_total).toFixed(1) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-nouvo-cream rounded-xl p-3 space-y-1.5">
          <div class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Subtotal</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.subtotal).toFixed(1) }}</span>
          </div>
          <div v-if="Number(order.discount) > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Discount</span>
            <span class="font-semibold text-nouvo-red">− {{ currency }} {{ Number(order.discount).toFixed(1) }}</span>
          </div>
          <div v-if="Number(order.tax) > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Tax</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.tax).toFixed(1) }}</span>
          </div>
          <div v-if="Number(order.delivery_charge) > 0" class="flex justify-between text-[12px]">
            <span class="text-nouvo-gray">Delivery</span>
            <span class="font-semibold text-nouvo-ink">{{ currency }} {{ Number(order.delivery_charge).toFixed(1) }}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-nouvo-gray-border/60">
            <span class="text-[13px] font-bold text-nouvo-ink">TOTAL</span>
            <span class="text-[15px] font-bold text-nouvo-green">{{ currency }} {{ Number(order.total).toFixed(1) }}</span>
          </div>
          <div class="flex justify-between text-[12px] pt-1">
            <span class="text-nouvo-gray">Payment</span>
            <span class="font-semibold text-nouvo-ink uppercase">{{ order.payment_method }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="text-[10px] font-bold px-2.5 py-1 rounded-full"
            :class="order.status === 'voided' ? 'bg-nouvo-red/10 text-nouvo-red' : 'bg-nouvo-green/10 text-nouvo-green'"
          >
            {{ order.status === 'voided' ? 'VOIDED' : 'COMPLETED' }}
          </span>
          <span class="text-[11px] text-nouvo-gray">{{ formatDateTime(order.created_at) }}</span>
        </div>
      </div>

      <footer class="px-6 py-4 border-t border-nouvo-gray-border flex items-center justify-between gap-2 shrink-0">
        <button
          v-if="order.status !== 'voided'"
          class="cursor-pointer px-4 py-2 rounded-full bg-nouvo-red text-white text-[12px] font-semibold hover:opacity-90"
          @click="showVoid = true"
        >Void Order</button>
        <div v-else class="text-[12px] text-nouvo-gray">Order is voided</div>

        <div class="flex items-center gap-2">
          <button class="cursor-pointer px-4 py-2 rounded-full border-2 border-nouvo-green/30 text-nouvo-green text-[12px] font-bold hover:bg-nouvo-cream flex items-center gap-1.5" @click="onReprint('customer')">
            🧾 Customer
          </button>
          <button class="cursor-pointer px-4 py-2 rounded-full border-2 border-nouvo-green/30 text-nouvo-green text-[12px] font-bold hover:bg-nouvo-cream flex items-center gap-1.5" @click="onReprint('kitchen')">
            👨‍🍳 Kitchen
          </button>
        </div>
      </footer>
    </div>

    <!-- Void confirm -->
    <div v-if="showVoid" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" @click.self="showVoid = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-[15px] font-bold text-nouvo-ink">Void Order?</h3>
        <p class="text-[12px] text-nouvo-gray">Yeh order void ho jayega. Kya aap confirm karte hain?</p>
        <input
          v-model="voidReason"
          type="text"
          placeholder="Reason (min 3 chars)"
          class="w-full px-3 py-2 border border-nouvo-gray-border rounded-xl text-[12px] outline-none focus:border-nouvo-green"
        />
        <div class="flex gap-2">
          <button class="cursor-pointer flex-1 py-2.5 rounded-full bg-nouvo-cream text-[12px] font-semibold" @click="showVoid = false">Cancel</button>
          <button
            :disabled="voidReason.trim().length < 3"
            class="cursor-pointer flex-1 py-2.5 rounded-full bg-nouvo-red text-white text-[12px] font-bold disabled:opacity-50"
            @click="onVoid"
          >Confirm Void</button>
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
import { invokeSafe } from '@/utils/ipc'
import ReceiptPreviewModal from '@/features/checkout/components/ReceiptPreviewModal.vue'

const props = defineProps<{ order: any }>()
const emit = defineEmits<{ close: []; updated: [] }>()

const items = ref<any[]>([])
const showVoid = ref(false)
const voidReason = ref('')
const currency = computed(() => 'Rs.')
const previewText = ref<string | null>(null)
const previewLines = ref<any[] | null>(null)
const previewType = ref<'customer' | 'kitchen'>('customer')

async function loadItems() {
  const res = await invokeSafe<any>('orders:get', props.order.id)
  if (res.ok && res.data) {
    items.value = res.data.items || []
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T'))
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function onVoid() {
  if (voidReason.value.trim().length < 3) return
  const res = await invokeSafe<any>('orders:void', {
    orderId: props.order.id,
    reason: voidReason.value.trim()
  })
  if (res.ok) {
    showVoid.value = false
    voidReason.value = ''
    emit('updated')
    emit('close')
  } else {
    alert('Void failed: ' + ((res as any).error?.message || 'Unknown'))
  }
}

async function onReprint(type: string) {
  const res = await invokeSafe<any>('print:preview', {
    orderId: props.order.id,
    type: type,
    copies: 1,
    isReprint: true
  })
  if (res.ok && (res.data as any)?.preview) {
    previewText.value = (res.data as any).preview
    previewLines.value = (res.data as any).lines || null
    previewType.value = type === 'kitchen' ? 'kitchen' : 'customer'
  } else {
    previewText.value = `[No preview available]`
    previewLines.value = null
  }
}

async function onPrintNow() {
  if (!props.order?.id) return
  await invokeSafe<any>('print:receipt', {
    orderId: props.order.id,
    type: previewType.value,
    copies: 1,
    isReprint: true
  })
}

function closePreview() {
  previewText.value = null
  previewLines.value = null
}

onMounted(() => {
  loadItems()
})
</script>
