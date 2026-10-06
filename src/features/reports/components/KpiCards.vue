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
      <div class="flex items-end gap-2">
        <div class="text-[26px] font-bold text-nouvo-ink leading-none">{{ formatNum(kpis.revenue) }}</div>
        <span class="flex items-center gap-0.5 text-[11px] font-bold text-nouvo-green bg-nouvo-green/10 px-2 py-0.5 rounded-full">
          ↗ 2%
        </span>
      </div>
    </div>

    <!-- On Progress -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">☀</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">On Progress</span>
      </div>
      <div class="text-[26px] font-bold text-nouvo-ink leading-none">{{ kpis.orderCount }} Orders</div>
    </div>

    <!-- Performance -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">📈</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">Performance</span>
      </div>
      <div class="text-[26px] font-bold text-nouvo-ink leading-none">
        {{ kpis.performance }}
        <span class="text-[14px] text-nouvo-gray font-normal">({{ kpis.orderCount }}/{{ kpis.orderCount + 10 }})</span>
      </div>
    </div>

    <!-- Avg Order -->
    <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[16px]">🛒</span>
        <span class="text-[11px] font-bold text-nouvo-gray uppercase tracking-wider">Avg Order</span>
      </div>
      <div class="text-[26px] font-bold text-nouvo-ink leading-none">{{ currency }} {{ formatNum(kpis.avgOrder) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ kpis: any; currency: string }>()

function formatNum(n: number) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>
