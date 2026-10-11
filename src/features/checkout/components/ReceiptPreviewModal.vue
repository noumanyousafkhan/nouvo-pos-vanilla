<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
      <header class="flex items-center justify-between px-5 py-3 border-b border-nouvo-gray-border">
        <div class="flex items-center gap-2">
          <span class="text-lg">🧾</span>
          <div>
            <div class="text-[13px] font-bold text-nouvo-ink">
              {{ type === 'kitchen' ? 'Kitchen Receipt' : 'Customer Receipt' }}
            </div>
            <div class="text-[10px] text-nouvo-gray">Preview (thermal 80mm)</div>
          </div>
        </div>
        <button class="cursor-pointer w-8 h-8 rounded-lg hover:bg-nouvo-cream text-nouvo-gray" @click="$emit('close')">✕</button>
      </header>

      <div class="flex-1 overflow-y-auto p-5 bg-nouvo-cream">
        <!-- Structured lines (image support) -->
        <div v-if="parsedLines" class="font-mono text-[11px] leading-[1.4] text-nouvo-ink">
          <template v-for="(line, idx) in parsedLines" :key="idx">
            <!-- Image -->
            <img
              v-if="line.type === 'image'"
              :src="fileUrl(line.path)"
              alt="Logo"
              class="mx-auto my-1 object-contain"
              :style="{ maxWidth: Math.min(line.maxWidth || 384, 300) / 2 + 'px' }"
            />
            <!-- Feed -->
            <div v-else-if="line.type === 'feed'" :style="{ height: (line.lines || 1) * 12 + 'px' }"></div>
            <!-- Divider -->
            <div v-else-if="line.type === 'divider'" class="border-t border-dashed border-nouvo-gray my-1"></div>
            <!-- Columns -->
            <div v-else-if="line.type === 'columns'" class="flex justify-between">
              <span :class="{ 'font-bold': line.bold }">{{ line.left }}</span>
              <span :class="{ 'font-bold': line.bold }">{{ line.right }}</span>
            </div>
            <!-- Text -->
            <div
              v-else
              :class="{
                'text-center': line.align === 'center',
                'text-right': line.align === 'right',
                'font-bold': line.bold,
                'text-[9px]': line.size === 'small',
                'text-[13px]': line.size === 'large'
              }"
            >{{ line.text }}</div>
          </template>
        </div>

        <!-- Fallback: text only -->
        <pre v-else class="font-mono text-[11px] leading-[1.4] text-nouvo-ink whitespace-pre-wrap">{{ text }}</pre>
      </div>

      <footer class="flex items-center gap-2 px-5 py-3 border-t border-nouvo-gray-border">
        <button class="cursor-pointer flex-1 bg-nouvo-cream text-nouvo-ink rounded-full py-2.5 text-[13px] font-semibold" @click="$emit('close')">Close</button>
        <button class="cursor-pointer flex-1 bg-nouvo-green text-white rounded-full py-2.5 text-[13px] font-semibold" @click="$emit('print')">Print</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text: string
  lines?: any[] | null
  type?: 'customer' | 'kitchen'
}

const props = withDefaults(defineProps<Props>(), {
  lines: null,
  type: 'customer'
})

defineEmits<{ close: []; print: [] }>()

const parsedLines = computed<any[] | null>(() => {
  if (props.lines && Array.isArray(props.lines) && props.lines.length > 0) {
    return props.lines
  }
  return null
})

function fileUrl(p: string): string {
  if (!p) return ''
  const normalized = String(p).replace(/\\/g, '/')
  return `nouvo-file://${normalized}`
}
</script>
