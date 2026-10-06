<template>
  <div>
    <h2 class="text-xl font-semibold text-nouvo-green mb-5">Printer Settings</h2>

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
const form = ref<any>({ ...store.printer })
const saving = ref(false)
const testing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const typeOptions = [
  { value: 'thermal', label: 'Thermal (ESC/POS)' },
  { value: 'laser', label: 'Laser' }
]
const connectionOptions = [
  { value: 'usb', label: 'USB' },
  { value: 'network', label: 'Network' },
  { value: 'serial', label: 'Serial' }
]

async function save() {
  saving.value = true
  message.value = ''
  const res = await store.updatePrinter({ ...form.value })
  saving.value = false
  if (res.ok) {
    message.value = 'Saved'
    messageType.value = 'success'
  } else if (!res.ok) {
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
  form.value = { ...store.printer }
})
</script>
