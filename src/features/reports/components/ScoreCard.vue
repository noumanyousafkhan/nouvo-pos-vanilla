<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-[16px]">⭐</span>
        <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Score</span>
      </div>
    </div>

    <div class="relative w-[180px] h-[180px] mx-auto mb-4">
      <svg viewBox="0 0 180 180" class="w-full h-full">
        <circle cx="90" cy="90" r="80" fill="none" stroke="#F5C842" stroke-width="2" stroke-dasharray="4 6" />
        <circle cx="90" cy="90" r="65" fill="none" stroke="#F0F0F0" stroke-width="8" />
        <circle
          cx="90" cy="90" r="65"
          fill="none"
          stroke="#025726"
          stroke-width="8"
          stroke-dasharray="408"
          :stroke-dashoffset="408 - ((score.score || 0) / 100) * 408"
          stroke-linecap="round"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center flex-col">
        <div class="text-[42px] font-bold text-nouvo-ink leading-none">{{ score.score || 0 }}</div>
        <div class="text-[10px] text-nouvo-gray mt-1">{{ score.totalOrders || 0 }} orders</div>
      </div>
    </div>

    <!-- Metrics (from backend) -->
    <div v-if="metrics.length > 0" class="space-y-2">
      <div
        v-for="(m, i) in metrics"
        :key="i"
        class="flex items-center gap-3 p-3 rounded-2xl transition-colors"
        :class="m.isAlert ? 'bg-nouvo-red/5' : 'bg-nouvo-green/5'"
      >
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center text-[14px] shrink-0"
          :class="m.isAlert ? 'bg-nouvo-red/15 text-nouvo-red' : 'bg-nouvo-green/15 text-nouvo-green'"
        >
          {{ m.isAlert ? '⚠' : '✓' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[12px] font-bold text-nouvo-ink">{{ m.label }}</div>
        </div>
        <div
          class="text-[13px] font-bold"
          :class="m.isAlert ? 'text-nouvo-red' : 'text-nouvo-green'"
        >{{ m.value }}</div>
      </div>
    </div>

    <div v-else class="text-center text-[11px] text-nouvo-gray py-3">
      No data for this period
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ score: any }>()

const metrics = computed(() => {
  const s = props.score || {}
  if (Array.isArray(s.metrics) && s.metrics.length > 0) {
    return s.metrics.map((m: any) => ({
      label: String(m.label ?? ''),
      value: String(m.value ?? ''),
      isAlert: !!m.isAlert
    }))
  }
  if (Array.isArray(s.complaints) && s.complaints.length > 0) {
    return s.complaints.map((c: any) => ({
      label: String(c.label ?? ''),
      value: String(c.value ?? ''),
      isAlert: true
    }))
  }
  return []
})
</script>
