<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-[16px]">📋</span>
      <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Order Types</span>
    </div>

    <div v-if="data.length === 0" class="text-center text-nouvo-gray text-[13px] py-6">No data</div>
    <div v-else class="space-y-3">
      <div v-for="row in data" :key="row.order_type" class="grid grid-cols-[110px_1fr_100px] gap-3 items-center">
        <div class="flex items-center gap-1.5 text-[13px] font-semibold">
          <span>{{ iconFor(row.order_type) }}</span>
          <span>{{ labelFor(row.order_type) }}</span>
        </div>
        <div class="h-2 bg-nouvo-cream rounded-full overflow-hidden">
          <div class="h-full bg-nouvo-gold" :style="{ width: row.percentage + '%' }"></div>
        </div>
        <div class="text-right">
          <div class="text-[12px] font-bold text-nouvo-green">{{ row.percentage.toFixed(0) }}%</div>
          <div class="text-[10px] text-nouvo-gray font-mono">{{ row.count }} orders</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ data: any[]; currency: string }>()

function iconFor(t: string) {
  if (t === 'dine_in') return '🍽'
  if (t === 'takeaway') return '🥡'
  return '🛵'
}
function labelFor(t: string) {
  if (t === 'dine_in') return 'Dine-In'
  if (t === 'takeaway') return 'Takeaway'
  return 'Delivery'
}
</script>
