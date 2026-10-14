<template>
  <div>
    <h2 class="text-xl font-semibold text-nouvo-green mb-5">Printer Settings</h2>

    <!-- Enable toggle -->
    <div class="mb-4 p-4 bg-nouvo-cream rounded-xl flex items-center justify-between">
      <div>
        <div class="text-[13px] font-bold text-nouvo-ink">Enable Printer</div>
        <div class="text-[11px] text-nouvo-gray">Turn on to send receipts to thermal printer</div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          v-model="form.enabled"
          class="sr-only peer"
        />
        <div class="w-11 h-6 bg-nouvo-gray-border rounded-full peer peer-checked:bg-nouvo-green peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NInput v-model="form.name" label="Printer Name" placeholder="e.g. EPSON TM-T20" />
      <NSelect v-model="form.type" label="Type" :options="typeOptions" />
      <NSelect v-model="form.connection" label="Connection" :options="connectionOptions" />
      <NInput v-if="form.connection === 'network'" v-model="form.address" label="Address" />
      <NInput v-if="form.connection === 'network'" v-model.number="form.port" label="Port" type="number" />
      <NInput v-model.number="form.width_mm" label="Paper Width (mm)" type="number" />
    </div>

    <div class="mt-5 flex flex-wrap gap-4">
      <NCheckbox v-model="form.cut_enabled" label="Auto-cut" />
      <NCheckbox v-model="form.beep_enabled" label="Beep" />
      <NCheckbox v-model="form.open_drawer" label="Open Cash Drawer" />
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <NButton variant="secondary" @click="testPrint" :loading="testing">
        {{ testing ? 'Printing...' : '🖨 Test Print' }}
      </NButton>
      <NButton :loading="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</NButton>
    </div>

    <p v-if="message" class="mt-3 text-sm" :class="messageType === 'success' ? 'text-nouvo-green' : 'text-nouvo-red'">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'
import { useSettingsStore } from '@/stores/settings'
import NInput from '@/components/ui/NInput.vue'
import NSelect from '@/components/ui/NSelect.vue'
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const store = useSettingsStore()
const form = ref<any>({ ...store.printer, enabled: false })
const saving = ref(false)
const testing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const typeOptions = [
  { value: 'thermal', label: 'Thermal (ESC/POS)' }
]
const connectionOptions = [
  { value: 'usb', label: 'USB' },
  { value: 'network', label: 'Network' },
  { value: 'serial', label: 'Serial' }
]

async function loadEnabled() {
  const res = await invokeSafe<any>('settings:getAll')
  if (res.ok && res.data && typeof res.data === 'object') {
    const v = res.data['printer.enabled']
    if (v != null) form.value.enabled = String(v).toLowerCase() === 'true'
  }
}

async function save() {
  saving.value = true
  message.value = ''
  const res = await store.updatePrinter({ ...form.value })

  // Save enabled flag separately
  await invokeSafe('settings:set', 'printer.enabled', String(form.value.enabled))

  saving.value = false
  if (res.ok) {
    message.value = 'Saved'
    messageType.value = 'success'
  } else {
    message.value = (res as any).error?.message || 'Save failed'
    messageType.value = 'error'
  }
}

async function testPrint() {
  testing.value = true
  message.value = ''
  const res = await invokeSafe<any>('print:test')
  testing.value = false

  if (res.ok && (res.data as any)?.ok) {
    message.value = (res.data as any).preview || 'Test print sent'
    messageType.value = 'success'
  } else if (!res.ok) {
    message.value = (res as any).error?.message || 'Test print failed'
    messageType.value = 'error'
  } else {
    message.value = (res.data as any)?.error || 'Test print failed'
    messageType.value = 'error'
  }
}

onMounted(() => {
  form.value = { ...store.printer, enabled: false }
  loadEnabled()
})
</script>
