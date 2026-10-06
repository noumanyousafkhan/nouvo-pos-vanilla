<template>
  <label class="n-checkbox">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="n-checkbox-label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<style scoped>
.n-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer !important;
  user-select: none;
}

.n-checkbox * {
  cursor: pointer !important;
}

.n-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: #1B4D3E;
  cursor: pointer !important;
  margin: 0;
  flex-shrink: 0;
}

.n-checkbox input:disabled {
  cursor: not-allowed !important;
}

.n-checkbox input:disabled + .n-checkbox-label {
  cursor: not-allowed !important;
  opacity: 0.5;
}

.n-checkbox-label {
  font-size: 13px;
  color: #1A1A1A;
  line-height: 1.4;
}
</style>
