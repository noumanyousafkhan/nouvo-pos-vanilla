<template>
  <div class="bg-white rounded-2xl border-2 border-nouvo-green/30 p-4 space-y-3">
    <!-- Row 1: Search + Range -->
    <div class="flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 min-w-[240px]">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-nouvo-gray text-sm">🔍</span>
        <input
          :value="local.search"
          type="text"
          placeholder="Search order #, invoice #, customer, phone..."
          class="w-full pl-9 pr-3 py-2 border-2 border-nouvo-green/30 rounded-xl text-[13px] outline-none focus:border-nouvo-green transition-colors"
          @input="onSearchInput"
          @keydown.enter="apply"
        />
      </div>

      <div class="flex gap-1 bg-nouvo-cream p-1 rounded-xl">
        <button
          v-for="r in ranges"
          :key="r.value"
          type="button"
          class="cursor-pointer px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
          :class="local.range === r.value ? 'bg-nouvo-green text-white' : 'text-nouvo-gray hover:text-nouvo-green'"
          @click="setRange(r.value)"
        >{{ r.label }}</button>
      </div>
    </div>

    <!-- Row 2: Custom dates (if custom) -->
    <div v-if="local.range === 'custom'" class="flex gap-3 items-center">
      <label class="text-[11px] font-semibold text-nouvo-gray uppercase">From</label>
      <input
        v-model="local.dateFrom"
        type="date"
        class="px-3 py-1.5 border-2 border-nouvo-green/30 rounded-lg text-[12px] outline-none focus:border-nouvo-green"
      />
      <label class="text-[11px] font-semibold text-nouvo-gray uppercase">To</label>
      <input
        v-model="local.dateTo"
        type="date"
        class="px-3 py-1.5 border-2 border-nouvo-green/30 rounded-lg text-[12px] outline-none focus:border-nouvo-green"
      />
      <button
        type="button"
        class="cursor-pointer bg-nouvo-green text-white px-4 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-nouvo-green-dark"
        @click="apply"
      >Apply</button>
    </div>

    <!-- Row 3: Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <select
        v-model="local.orderType"
        class="px-3 py-2 border-2 border-nouvo-green/30 rounded-xl text-[12px] outline-none cursor-pointer focus:border-nouvo-green bg-white"
        @change="apply"
      >
        <option :value="undefined">All Types</option>
        <option value="dine_in">Dine-In</option>
        <option value="takeaway">Takeaway</option>
        <option value="delivery">Delivery</option>
      </select>

      <select
        v-model="local.paymentMethod"
        class="px-3 py-2 border-2 border-nouvo-green/30 rounded-xl text-[12px] outline-none cursor-pointer focus:border-nouvo-green bg-white"
        @change="apply"
      >
        <option :value="undefined">All Payments</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
      </select>

      <select
        v-model="local.status"
        class="px-3 py-2 border-2 border-nouvo-green/30 rounded-xl text-[12px] outline-none cursor-pointer focus:border-nouvo-green bg-white"
        @change="apply"
      >
        <option value="completed">Completed</option>
        <option value="voided">Voided</option>
      </select>

      <button
        type="button"
        class="cursor-pointer bg-nouvo-cream text-nouvo-green px-4 py-2 rounded-xl text-[12px] font-semibold hover:bg-nouvo-green hover:text-white transition-colors ml-auto"
        @click="reset"
      >Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: any }>()
const emit = defineEmits<{ 'update:modelValue': [any]; apply: [] }>()

const local = ref({ ...props.modelValue })
let searchTimeout: any = null

watch(() => props.modelValue, (v) => { local.value = { ...v } })

const ranges = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' }
]

function onSearchInput(e: Event) {
  local.value.search = (e.target as HTMLInputElement).value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(apply, 400)
}

function setRange(r: string) {
  local.value.range = r
  if (r !== 'custom') {
    local.value.dateFrom = undefined
    local.value.dateTo = undefined
    apply()
  }
}

function apply() {
  emit('update:modelValue', { ...local.value })
  emit('apply')
}

function reset() {
  local.value = {
    search: '',
    range: 'today',
    dateFrom: undefined,
    dateTo: undefined,
    orderType: undefined,
    paymentMethod: undefined,
    status: 'completed',
    includeVoided: false,
    limit: 50,
    offset: 0,
    sortBy: 'created_at',
    sortDir: 'desc'
  }
  apply()
}
</script>
