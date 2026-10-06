<template>
  <div>
    <h2 class="text-xl font-semibold text-nouvo-green mb-5">Business Information</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NInput v-model="form.name" label="Business Name" required />
      <NInput v-model="form.slogan" label="Slogan" />
      <div class="md:col-span-2">
        <NInput v-model="form.address" label="Address" />
      </div>
      <NInput v-model="form.phone_1" label="Phone 1" />
      <NInput v-model="form.phone_2" label="Phone 2" />
      <NInput v-model="form.email" label="Email" type="email" />
      <NInput v-model="form.website" label="Website" />
      <NInput v-model="form.currency_symbol" label="Currency Symbol" />
      <NInput v-model="form.currency_code" label="Currency Code" />
      <NInput v-model.number="form.tax_rate" label="Tax Rate (%)" type="number" />
      <NInput v-model="form.tax_label" label="Tax Label" />
    </div>

    <div class="mt-5">
      <NCheckbox v-model="form.tax_inclusive" label="Tax inclusive in price" />
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <NButton variant="secondary" @click="uploadLogo">Upload Logo</NButton>
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
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const store = useSettingsStore()

const form = ref<any>({ ...store.business })
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

async function save() {
  saving.value = true
  message.value = ''
  const payload = { ...form.value }
  const res = await store.updateBusiness(payload)
  saving.value = false
  if (res.ok) {
    message.value = 'Saved'
    messageType.value = 'success'
  } else {
    message.value = res.error?.message || 'Save failed'
    messageType.value = 'error'
  }
}

async function uploadLogo() {
  const res = await invokeSafe<any>('settings:uploadLogo')
  if (res.ok && res.data) {
    form.value.logo_path = res.data
    message.value = 'Logo uploaded'
    messageType.value = 'success'
  }
}

onMounted(() => {
  form.value = { ...store.business }
})
</script>
