<template>
  <div
    class="rounded-2xl border-2 p-5 flex flex-col transition-colors shadow-sm"
    :class="cardClass"
  >
    <!-- Header: Order # + Timer -->
    <div class="flex items-start justify-between mb-3">
      <div>
        <div class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">
          Order
        </div>
        <div class="text-[15px] font-bold text-nouvo-ink leading-tight">
          #{{ shortOrderNumber }}
        </div>
        <div class="text-[10px] text-nouvo-gray mt-0.5">
          {{ orderLabel }}
        </div>
      </div>
      <div class="text-right">
        <div v-if="!isDelayed" class="text-[26px] font-bold leading-none tabular-nums" :class="timerColorClass">
          {{ remainingLabel }}
        </div>
        <div v-else class="text-right">
          <div class="text-[10px] font-bold text-red-600 uppercase tracking-wider">Delayed</div>
          <div class="text-[20px] font-bold text-red-600 leading-none tabular-nums">
            +{{ delayLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- Items -->
    <div class="flex-1 overflow-hidden mb-3">
      <div v-if="order.items && order.items.length > 0" class="space-y-1.5">
        <div v-for="item in order.items" :key="item.id" class="text-[12px]">
          <!-- Deal item with children -->
          <template v-if="item.deal_id && item.deal_children && item.deal_children.length > 0">
            <div class="font-bold text-nouvo-ink mb-1">
              {{ item.product_name }} × {{ item.quantity }}
            </div>
            <div class="ml-2 space-y-1">
              <div v-for="(child, ci) in item.deal_children" :key="ci">
                <div class="text-nouvo-ink flex items-start gap-1">
                  <span class="text-nouvo-green font-bold">+</span>
                  <span class="font-semibold">
                    {{ child.productName }}<span v-if="child.variantName" class="font-normal text-nouvo-gray"> ({{ child.variantName }})</span>
                    <span class="font-normal text-nouvo-gray"> × {{ child.quantity }}</span>
                  </span>
                </div>
                <div
                  v-for="(f, fi) in (child.selectedFlavours || [])"
                  :key="'f' + fi"
                  class="ml-3 text-[11px] text-nouvo-gray"
                >
                  • {{ f.flavourName }}<span v-if="f.quantity > 1"> ×{{ f.quantity }}</span>
                </div>
                <div
                  v-for="(m, mi) in (child.modifiers || [])"
                  :key="'m' + mi"
                  class="ml-3 text-[11px] text-nouvo-gray"
                >
                  + {{ m.optionName }}
                </div>
              </div>
            </div>
          </template>

          <!-- Normal product -->
          <template v-else>
            <div class="text-nouvo-ink">
              <span class="font-semibold">{{ item.product_name }}</span>
              <span v-if="item.variant_name" class="text-nouvo-gray"> ({{ item.variant_name }})</span>
              <span class="text-nouvo-gray"> × {{ item.quantity }}</span>
            </div>
            <div
              v-for="(m, mi) in (item.modifiers || [])"
              :key="'nm' + mi"
              class="ml-3 text-[11px] text-nouvo-gray"
            >
              + {{ m.option_name }}
            </div>
          </template>
        </div>
      </div>
      <div v-else class="text-[11px] text-nouvo-gray italic">
        No items
      </div>
    </div>

    <!-- Footer: Created + Complete button -->
    <div class="pt-3 border-t border-black/10">
      <div class="text-[11px] text-nouvo-gray mb-3">
        Created: {{ createdTime }}
      </div>
      <button
        type="button"
        class="cursor-pointer w-full bg-nouvo-green text-white rounded-full py-2.5 text-[12px] font-bold hover:bg-nouvo-green-dark transition-colors active:scale-[0.98]"
        @click="$emit('complete', order.id)"
      >
        COMPLETED
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  order: any
  now: number
  prepTimeMinutes: number
}>()

defineEmits<{ complete: [number] }>()

/**
 * Parse SQLite `created_at` (which is UTC "YYYY-MM-DD HH:MM:SS")
 * into a proper JS timestamp (milliseconds).
 *
 * SQLite's datetime('now') returns UTC time in format "YYYY-MM-DD HH:MM:SS".
 * JavaScript's `new Date("2026-10-08 00:57:37")` treats it as LOCAL time.
 * We force UTC by converting to ISO format with 'Z' suffix.
 */
function parseSqliteUtcMs(raw: string): number {
  const s = String(raw || '').trim()
  if (!s) return Date.now()

  // If already ISO with Z or offset, parse directly
  if (s.includes('T') && (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s))) {
    return new Date(s).getTime()
  }

  // If has 'T' but no timezone → treat as UTC
  if (s.includes('T')) {
    return new Date(s + 'Z').getTime()
  }

  // SQLite format "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ"
  return new Date(s.replace(' ', 'T') + 'Z').getTime()
}

/**
 * Timer calculations (authoritative — derived from created_at, not a variable)
 */
const deadlineMs = computed(() => {
  const created = parseSqliteUtcMs(props.order.created_at)
  return created + props.prepTimeMinutes * 60 * 1000
})

const remainingMs = computed(() => deadlineMs.value - props.now)
const isDelayed = computed(() => remainingMs.value <= 0)

const remainingLabel = computed(() => {
  const ms = Math.max(0, remainingMs.value)
  const totalSec = Math.floor(ms / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const delayLabel = computed(() => {
  const ms = Math.max(0, props.now - deadlineMs.value)
  const totalSec = Math.floor(ms / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const cardClass = computed(() => {
  if (isDelayed.value) {
    return 'bg-red-50 border-red-400'
  }
  const remainingMin = remainingMs.value / 60000
  if (remainingMin <= 5) return 'bg-red-50 border-red-300'
  if (remainingMin <= 10) return 'bg-orange-50 border-orange-300'
  return 'bg-white border-nouvo-gray-border'
})

const timerColorClass = computed(() => {
  const remainingMin = remainingMs.value / 60000
  if (remainingMin <= 5) return 'text-red-600'
  if (remainingMin <= 10) return 'text-orange-600'
  return 'text-nouvo-green'
})

const shortOrderNumber = computed(() => {
  const num = String(props.order.order_number || '')
  const match = num.match(/(\d+)$/)
  return match ? match[1] : num
})

/**
 * Order label — type + table + customer info
 */
const orderLabel = computed(() => {
  const parts: string[] = []
  const type = String(props.order.order_type || '')
  if (type === 'dine_in') parts.push('Dine-In')
  else if (type === 'takeaway') parts.push('Takeaway')
  else if (type === 'delivery') parts.push('Delivery')
  else parts.push(type)

  if (props.order.table_number) parts.push(`Table ${props.order.table_number}`)
  if (props.order.customer_name) parts.push(props.order.customer_name)

  return parts.join(' · ')
})

/**
 * Created time — displayed in local time
 */
const createdTime = computed(() => {
  const ms = parseSqliteUtcMs(props.order.created_at)
  const d = new Date(ms)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})
</script>
