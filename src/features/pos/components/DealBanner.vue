<template>
  <div
    class="cursor-pointer rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 shadow-md min-h-[130px]"
    style="background: linear-gradient(135deg, #1B4D3E 0%, #2A6B55 100%);"
    @click="$emit('add', deal)"
  >
    <!-- Decorative circle -->
    <div class="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>

    <!-- Left: Text -->
    <div class="flex-1 text-white relative z-10">
      <div class="text-[10px] tracking-[2.5px] text-nouvo-yellow font-bold mb-1.5">
        ⚡ DEAL OF THE DAY
      </div>
      <div class="text-[22px] font-bold mb-1.5 leading-tight">{{ deal.name }}</div>
      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-bold text-nouvo-yellow">
          {{ currency }} {{ deal.price.toFixed(2) }}
        </span>
      </div>
    </div>

    <!-- Right: Image -->
    <div class="w-[110px] h-[110px] bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative z-10 border border-white/10">
      <img
        v-if="deal.image_path"
        :src="fileUrl(deal.image_path)"
        class="max-w-full max-h-full object-contain"
        loading="lazy"
      />
      <span v-else class="text-[48px] text-nouvo-yellow">★</span>
    </div>

    <!-- Add button -->
    <button
      class="cursor-pointer absolute bottom-3 right-3 bg-nouvo-yellow text-nouvo-green border-none px-4 py-2 rounded-xl font-bold text-[12px] hover:bg-white transition-colors shadow-md z-10"
      @click.stop="$emit('add', deal)"
    >+ Add to Cart</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{ deal: any }>()
defineEmits<{ add: [any] }>()

const currency = ref('Rs.')

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/')
  // using nouvo-file protocol
  return `nouvo-file:///${normalized}`
}

onMounted(async () => {
  const res = await (window as any).nouvo.invoke('settings:getBusiness')
  if (res?.ok) currency.value = res.data.currency_symbol
})
</script>
