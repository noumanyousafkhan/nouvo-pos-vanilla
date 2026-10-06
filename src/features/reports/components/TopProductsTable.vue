<template>
  <div class="bg-white rounded-3xl border border-nouvo-green/15 p-5 shadow-sm">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-[16px]">🏆</span>
      <span class="text-[13px] font-bold text-nouvo-ink uppercase tracking-wider">Top Products</span>
    </div>

    <div v-if="products.length === 0" class="text-center text-nouvo-gray text-[13px] py-6">No data</div>
    <table v-else class="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th class="text-left text-[10px] text-nouvo-gray uppercase py-2 border-b border-nouvo-gray-border">#</th>
          <th class="text-left text-[10px] text-nouvo-gray uppercase py-2 border-b border-nouvo-gray-border">Product</th>
          <th class="text-right text-[10px] text-nouvo-gray uppercase py-2 border-b border-nouvo-gray-border">Qty</th>
          <th class="text-right text-[10px] text-nouvo-gray uppercase py-2 border-b border-nouvo-gray-border">Revenue</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in products" :key="p.product_id">
          <td class="py-2 text-nouvo-gold font-bold">{{ i + 1 }}</td>
          <td class="py-2 text-nouvo-ink">{{ p.product_name }}</td>
          <td class="py-2 text-right font-mono text-nouvo-green">{{ p.total_qty }}</td>
          <td class="py-2 text-right font-mono text-nouvo-green">{{ currency }} {{ Number(p.total_revenue).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{ products: any[]; currency: string }>()
</script>
