<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-5 py-3 border-b border-nouvo-gray-border">
        <div class="flex items-center gap-2">
          <span class="text-lg">🧾</span>
          <div>
            <div class="text-[13px] font-bold text-nouvo-ink">Customer Receipt</div>
            <div class="text-[10px] text-nouvo-gray">Preview (thermal 80mm)</div>
          </div>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-5 bg-nouvo-cream">
        <pre class="font-mono text-[11px] leading-[1.4] text-nouvo-ink whitespace-pre-wrap">{{ text }}</pre>
      </div>

      <footer class="flex items-center gap-2 px-5 py-3 border-t border-nouvo-gray-border">
        <button class="cursor-pointer flex-1 bg-nouvo-cream text-nouvo-ink rounded-full py-2.5 text-[13px] font-semibold" @click="$emit('close')">Close</button>
        <button class="cursor-pointer flex-1 bg-nouvo-green text-white rounded-full py-2.5 text-[13px] font-semibold" @click="$emit('print')">Print</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string; type?: 'customer' | 'kitchen' }>()
defineEmits<{ close: []; print: [] }>()
</script>
