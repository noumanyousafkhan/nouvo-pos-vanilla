<template>
  <div>
    <h2 class="text-xl font-semibold text-nouvo-green mb-5">Receipt Settings</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NInput v-model="form.header_line_1" label="Header Line 1" />
      <NInput v-model="form.header_line_2" label="Header Line 2" />
      <NInput v-model="form.footer_line_1" label="Footer Line 1" />
      <NInput v-model="form.footer_line_2" label="Footer Line 2" />
      <NInput v-model.number="form.copies_customer" label="Customer Copies" type="number" />
      <NInput v-model.number="form.copies_kitchen" label="Kitchen Copies" type="number" />
    </div>

    <div class="mt-5 flex flex-wrap gap-4">
      <NCheckbox v-model="form.show_logo" label="Show Logo" />
      <NCheckbox v-model="form.show_tax" label="Show Tax" />
      <NCheckbox v-model="form.show_customer" label="Show Customer" />
      <NCheckbox v-model="form.show_table" label="Show Table" />
      <NCheckbox v-model="form.show_order_type" label="Show Order Type" />
      <NCheckbox v-model="form.kitchen_show_prices" label="Kitchen Show Prices" />
    </div>

    <div class="mt-6 flex justify-end">
      <NButton :loading="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</NButton>
    </div>

    <p v-if="message" class="mt-3 text-sm" :class="messageType === 'success' ? 'text-nouvo-green' : 'text-nouvo-red'">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import NInput from '@/components/ui/NInput.vue'
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const store = useSettingsStore()
const form = ref<any>({ ...store.receipt })
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

async function save() {
  saving.value = true
  message.value = ''
  const res = await store.updateReceipt({ ...form.value })
  saving.value = false
  if (res.ok) {
    message.value = 'Saved'
    messageType.value = 'success'
  } else {
    message.value = res.error?.message || 'Save failed'
    messageType.value = 'error'
  }
}

onMounted(() => {
  form.value = { ...store.receipt }
})
</script>
