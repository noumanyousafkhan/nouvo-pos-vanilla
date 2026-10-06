<template>
  <div
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h2 class="text-lg font-bold text-nouvo-green mb-5">
        {{ category ? 'Edit' : 'New' }} Category
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">
            Name <span class="text-nouvo-red">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            maxlength="100"
            placeholder="e.g. Pizza"
            autofocus
            class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green transition-colors"
            @keydown.enter="save"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-nouvo-ink mb-1.5">Sort Order</label>
          <input
            v-model.number="form.sort_order"
            type="number"
            class="w-full px-3 py-2 border border-nouvo-gray-border rounded-lg text-sm outline-none focus:border-nouvo-green transition-colors"
          />
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="form.is_active" class="cursor-pointer" />
          <span>Active</span>
        </label>
      </div>

      <p v-if="error" class="mt-3 text-[12px] text-nouvo-red bg-red-50 px-3 py-2 rounded-lg">
        {{ error }}
      </p>

      <div class="flex justify-end gap-2 mt-6">
        <button
          type="button"
          class="cursor-pointer bg-nouvo-cream text-nouvo-ink px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-cream-dark transition-colors"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="saving"
          class="cursor-pointer bg-nouvo-green text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-nouvo-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="save"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'

const props = defineProps<{ category?: any }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const form = ref({
  name: '',
  sort_order: 0,
  is_active: true,
  image_path: ''
})

const saving = ref(false)
const error = ref('')

async function save() {
  if (!form.value.name.trim()) {
    error.value = 'Name is required'
    return
  }

  saving.value = true
  error.value = ''

  // Build plain payload — no Vue Proxy
  const payload = {
    name: String(form.value.name).trim(),
    sort_order: Number(form.value.sort_order) || 0,
    is_active: !!form.value.is_active,
    image_path: String(form.value.image_path || '')
  }

  let res
  if (props.category && props.category.id) {
    res = await invokeSafe<any>('menu:categories:update', props.category.id, payload)
  } else {
    res = await invokeSafe<any>('menu:categories:create', payload)
  }

  saving.value = false

  if (res.ok) {
    emit('saved')
  } else {
    error.value = res.error?.message || 'Save failed'
  }
}

onMounted(() => {
  if (props.category) {
    form.value = {
      name: props.category.name || '',
      sort_order: props.category.sort_order ?? 0,
      is_active: !!props.category.is_active,
      image_path: props.category.image_path || ''
    }
  }
})
</script>
