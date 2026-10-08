<template>
  <div class="grid grid-cols-4 gap-5">
    <!-- Total Revenue -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-[16px]">💰</span>
          <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">Total Revenue</span>
        </div>
        <button class="text-[10px] text-nouvo-gray hover:text-nouvo-green">Details</button>
      </div>
      <div class="flex items-end gap-2 flex-wrap">
        <div class="text-[26px] font-bold text-nouvo-ink leading-none">{{ formatNum(kpis.revenue) }}</div>
        <!-- Trend (only if not null) -->
        <span
          v-if="kpis.revenueTrend !== null && kpis.revenueTrend !== undefined"
          class="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
          :class="trendClass(kpis.revenueTrend)"
        >
          {{ trendIcon(kpis.revenueTrend) }} {{ Math.abs(kpis.revenueTrend).toFixed(1) }}%
        </span>
        <span
          v-else
          class="text-[11px] text-nouvo-gray px-2 py-0.5"
        >—</span>
      </div>
    </div>

    <!-- On Progress / Orders -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">☀</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">On Progress</span>
      </div>
      <div class="flex items-end gap-2 flex-wrap">
        <div class="text-[26px] font-bold text-nouvo-ink leading-none">{{ kpis.orderCount || 0 }} Orders</div>
        <span
          v-if="kpis.orderTrend !== null && kpis.orderTrend !== undefined"
          class="flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
          :class="trendClass(kpis.orderTrend)"
        >
          {{ trendIcon(kpis.orderTrend) }} {{ Math.abs(kpis.orderTrend).toFixed(1) }}%
        </span>
      </div>
    </div>

    <!-- Performance -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">📈</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">Performance</span>
      </div>
      <div class="text-[26px] font-bold leading-none" :class="performanceClass(kpis.performance)">
        {{ kpis.performance || 'No Data' }}
      </div>
      <div class="text-[11px] text-nouvo-gray mt-2">
        {{ kpis.orderCount || 0 }} orders this period
      </div>
    </div>

    <!-- Avg Order -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">🛒</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">Avg Order</span>
      </div>
      <div class="text-[26px] font-bold text-nouvo-ink leading-none">
        {{ currency }} {{ formatNum(kpis.avgOrder) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ kpis: any; currency: string }>()

function formatNum(n: number) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/**
 * Trend helpers — handle null (no previous period).
 */
function trendClass(value: number | null | undefined) {
  if (value === null || value === undefined) return 'text-nouvo-gray bg-nouvo-cream'
  if (value > 0) return 'text-nouvo-green bg-nouvo-green/10'
  if (value < 0) return 'text-nouvo-red bg-nouvo-red/10'
  return 'text-nouvo-gray bg-nouvo-cream'
}

function trendIcon(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  if (value > 0) return '↗'
  if (value < 0) return '↘'
  return '→'
}

/**
 * Performance label colors.
 */
function performanceClass(label: string) {
  const s = String(label || '').toLowerCase()
  if (s === 'excellent') return 'text-nouvo-green'
  if (s === 'good') return 'text-nouvo-green'
  if (s === 'low') return 'text-orange-600'
  if (s === 'no data') return 'text-nouvo-gray'
  return 'text-nouvo-ink'
}
</script>
