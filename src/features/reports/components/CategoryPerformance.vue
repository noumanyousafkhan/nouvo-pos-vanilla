<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-[16px]">📂</span>
      <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Category Performance</span>
    </div>

    <div v-if="data.length === 0" class="text-center text-nouvo-gray text-[13px] py-6">No data</div>
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
      <div v-for="cat in data" :key="cat.category_id" class="bg-nouvo-cream rounded-xl p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[13px] font-semibold text-nouvo-ink">{{ cat.category_name ?? 'Uncategorized' }}</span>
          <span class="text-[12px] font-bold text-nouvo-green">{{ cat.percentage.toFixed(1) }}%</span>
        </div>
        <div class="h-1.5 bg-white rounded-full overflow-hidden mb-2">
          <div class="h-full bg-nouvo-green" :style="{ width: cat.percentage + '%' }"></div>
        </div>
        <div class="flex justify-between text-[11px] text-nouvo-gray">
          <span>{{ cat.qty }} items</span>
          <span class="font-mono">{{ currency }} {{ Number(cat.revenue).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ data: any[]; currency: string }>()
</script>
