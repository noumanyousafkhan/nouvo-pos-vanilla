<template>
  <div class="flex items-center gap-3 flex-wrap">
    <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-nouvo-gray-border">
      <button
        v-for="p in timeFilters"
        :key="p.value"
        class="cursor-pointer px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
        :class="local.range === p.value ? 'bg-nouvo-green text-white' : 'text-nouvo-gray hover:bg-nouvo-cream'"
        @click="setRange(p.value)"
      >{{ p.label }}</button>
    </div>

    <div v-if="local.range === 'custom'" class="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-nouvo-gray-border">
      <input v-model="local.dateFrom" type="date" class="px-2 py-1 border border-nouvo-gray-border rounded-lg text-[12px] outline-none focus:border-nouvo-green" />
      <span class="text-nouvo-gray text-[12px]">to</span>
      <input v-model="local.dateTo" type="date" class="px-2 py-1 border border-nouvo-gray-border rounded-lg text-[12px] outline-none focus:border-nouvo-green" />
      <button class="cursor-pointer bg-nouvo-green text-white px-3 py-1 rounded-lg text-[11px] font-semibold" @click="apply">Apply</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: any }>()
const emit = defineEmits<{ 'update:modelValue': [any]; apply: []; refresh: [] }>()

const local = ref({ ...props.modelValue })

watch(() => props.modelValue, (v) => { local.value = { ...v } })

const timeFilters = [
  { value: 'today', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' }
]

function setRange(v: string) {
  local.value.range = v
  if (v !== 'custom') apply()
}

function apply() {
  emit('update:modelValue', { ...local.value })
  emit('apply')
  emit('refresh')
}
</script>
