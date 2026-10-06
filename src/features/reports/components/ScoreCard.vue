<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-[16px]">⭐</span>
        <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Score</span>
      </div>
      <button class="text-[14px] text-nouvo-gray">⋯</button>
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
          :stroke-dashoffset="408 - (score.score / 100) * 408"
          stroke-linecap="round"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center flex-col">
        <div class="text-[42px] font-bold text-nouvo-ink leading-none">{{ score.score }}</div>
        <div class="text-[10px] text-nouvo-gray mt-1">{{ score.totalOrders }} orders</div>
      </div>
    </div>

    <!-- Complaints from DB (only if any) -->
    <div v-if="score.complaints && score.complaints.length > 0" class="space-y-2">
      <div
        v-for="(c, i) in score.complaints"
        :key="i"
        class="flex items-center gap-3 p-3 bg-nouvo-red/5 rounded-2xl"
      >
        <div class="w-9 h-9 rounded-full bg-nouvo-red/15 flex items-center justify-center text-[14px] shrink-0">
          ⚠
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[12px] font-bold text-nouvo-ink">{{ c.label }}</div>
        </div>
        <div class="text-[13px] font-bold text-nouvo-red">{{ c.value }}</div>
      </div>
    </div>

    <div v-else class="text-center text-[11px] text-nouvo-gray py-3">
      No complaints 🎉
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ score: any }>()
</script>
