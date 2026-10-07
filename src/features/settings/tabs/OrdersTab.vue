<template>
  <div>
    <h2 class="text-xl font-semibold text-nouvo-green mb-5">Order Settings</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NInput v-model.number="form.delivery_charge_default" label="Delivery Charge Default" type="number" />
      <NSelect v-model="form.default_order_type" label="Default Order Type" :options="orderTypeOptions" />
      <NInput v-model="form.invoice_prefix" label="Invoice Prefix" />
      <NInput v-model="form.order_prefix" label="Order Prefix" />
      <NInput v-model.number="form.discount_max_percent" label="Max Discount %" type="number" />
      <NInput
        v-model.number="form.prep_time_minutes"
        label="Preparation Time (minutes)"
        type="number"
      />
    </div>

    <div class="mt-5 flex flex-wrap gap-4">
      <NCheckbox v-model="form.delivery_charge_enabled" label="Delivery Charge Enabled" />
      <NCheckbox v-model="form.require_customer_for_delivery" label="Require Customer for Delivery" />
      <NCheckbox v-model="form.require_table_for_dine_in" label="Require Table for Dine-In" />
      <NCheckbox v-model="form.auto_print_on_checkout" label="Auto Print on Checkout" />
      <NCheckbox v-model="form.discount_enabled" label="Discount Enabled" />
    </div>

    <p class="mt-3 text-[11px] text-nouvo-gray">
      Preparation time is used by the Order Timer view to compute countdown and delay.
    </p>

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
import NSelect from '@/components/ui/NSelect.vue'
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const store = useSettingsStore()
const form = ref<any>({ ...store.order })
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const orderTypeOptions = [
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' }
]

async function save() {
  saving.value = true
  message.value = ''

  const prepMin = Number(form.value.prep_time_minutes)
  if (!prepMin || prepMin < 1 || prepMin > 240) {
    message.value = 'Preparation time must be between 1 and 240 minutes'
    messageType.value = 'error'
    saving.value = false
    return
  }
  form.value.prep_time_minutes = prepMin

  const res = await store.updateOrder({ ...form.value })
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
  form.value = { ...store.order }
})
</script>
