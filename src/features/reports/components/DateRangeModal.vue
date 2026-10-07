<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h2 class="text-lg font-bold text-nouvo-green mb-4">Custom Date Range</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">From</label>
          <input
            v-model="fromDate"
            type="date"
            class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">To</label>
          <input
            v-model="toDate"
            type="date"
            class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green"
          />
        </div>

        <p v-if="error" class="text-[12px] text-nouvo-red bg-red-50 px-3 py-2 rounded-lg">
          {{ error }}
        </p>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button
          type="button"
          class="cursor-pointer bg-nouvo-cream text-nouvo-ink px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-cream-dark"
          @click="$emit('close')"
        >Cancel</button>
        <button
          type="button"
          class="cursor-pointer bg-nouvo-green text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark"
          @click="apply"
        >Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  from?: string
  to?: string
}>()

const emit = defineEmits<{ close: []; apply: [{ from: string; to: string }] }>()

const fromDate = ref('')
const toDate = ref('')
const error = ref('')

onMounted(() => {
  // Default: last 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  fromDate.value = props.from || thirtyDaysAgo.toISOString().slice(0, 10)
  toDate.value = props.to || today.toISOString().slice(0, 10)
})

function apply() {
  error.value = ''

  if (!fromDate.value) { error.value = 'From date is required'; return }
  if (!toDate.value) { error.value = 'To date is required'; return }
  if (fromDate.value > toDate.value) {
    error.value = 'From date must be before To date'
    return
  }

  emit('apply', { from: fromDate.value, to: toDate.value })
}
</script>
