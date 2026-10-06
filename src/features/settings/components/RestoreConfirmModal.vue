<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-nouvo-red/10 flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E85A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <h2 class="text-[16px] font-bold text-nouvo-red">Confirm Restore</h2>
          <p class="text-[12px] text-nouvo-gray">This will replace all current data</p>
        </div>
      </div>

      <p class="text-[13px] text-nouvo-ink mb-4 leading-relaxed">
        Aap <strong>backup</strong> restore karne ja rahe hain. Yeh action:
      </p>

      <ul class="text-[12px] text-nouvo-gray mb-4 space-y-1.5 pl-4">
        <li>• Current database ko <strong class="text-nouvo-ink">replace</strong> karega</li>
        <li>• Safety ke liye <strong class="text-nouvo-ink">pre-restore backup</strong> banega</li>
        <li>• App restart hogi restore ke baad</li>
      </ul>

      <div class="bg-nouvo-cream rounded-xl p-4 mb-4 text-[12px]">
        <div class="flex justify-between py-1">
          <span class="text-nouvo-gray">Backup Date</span>
          <strong class="text-nouvo-ink">{{ formatDateTime(backup.created_at) }}</strong>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-nouvo-gray">Type</span>
          <strong class="text-nouvo-ink">{{ backup.type }}</strong>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-nouvo-gray">Size</span>
          <strong class="text-nouvo-ink">{{ formatSize(backup.size) }}</strong>
        </div>
        <div v-if="backup.note" class="flex justify-between py-1">
          <span class="text-nouvo-gray">Note</span>
          <strong class="text-nouvo-ink">{{ backup.note }}</strong>
        </div>
      </div>

      <label class="flex items-center gap-2 mb-4 cursor-pointer select-none">
        <input
          v-model="confirmed"
          type="checkbox"
          class="cursor-pointer w-4 h-4 accent-nouvo-red"
        />
        <span class="text-[12px] text-nouvo-ink">
          I understand this will replace all current data
        </span>
      </label>

      <div class="flex gap-2">
        <button
          type="button"
          class="cursor-pointer flex-1 bg-white border-2 border-nouvo-gray-border rounded-full py-2.5 text-[13px] font-semibold text-nouvo-ink hover:bg-nouvo-cream transition-colors"
          @click="$emit('close')"
        >Cancel</button>
        <button
          type="button"
          :disabled="!confirmed || restoring"
          class="cursor-pointer flex-1 bg-nouvo-red text-white rounded-full py-2.5 text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('confirm')"
        >{{ restoring ? 'Restoring...' : 'Restore Backup' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ backup: any; restoring?: boolean }>()
defineEmits<{ close: []; confirm: [] }>()

const confirmed = ref(false)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(1)} ${units[i]}`
}
</script>
