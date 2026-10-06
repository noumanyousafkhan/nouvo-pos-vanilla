<template>
  <div class="n-select-wrap">
    <label v-if="label" :for="selectId" class="n-label">
      {{ label }}
      <span v-if="required" class="n-required">*</span>
    </label>

    <div class="n-select-inner">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        class="n-select"
        :class="{ 'n-select-error': error }"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <span class="n-select-arrow">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>

    <p v-if="error" class="n-error">{{ error }}</p>
    <p v-else-if="hint" class="n-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  label?: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  required: false,
  error: '',
  hint: ''
})

const emit = defineEmits<{
  'update:modelValue': [string | number]
}>()

const selectId = useId()

function onChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  emit('update:modelValue', value)
}
</script>

<style scoped>
.n-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Label — arrow cursor (headings) */
.n-label {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A1A;
  cursor: default;
  user-select: none;
}

.n-required {
  color: #E85A5A;
  margin-left: 2px;
}

.n-select-inner {
  position: relative;
  display: flex;
  align-items: center;
}

.n-select {
  width: 100%;
  padding: 14px 40px 14px 16px;
  border: 1.5px solid #D0D0D0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: white;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.n-select:hover:not(:disabled) {
  border-color: #1B4D3E;
}

.n-select:focus {
  border-color: #1B4D3E;
  box-shadow: 0 0 0 3px rgba(27, 77, 62, 0.08);
}

.n-select:disabled {
  background: #FAFAFA;
  cursor: not-allowed;
  color: #8A8A8A;
}

.n-select-error {
  border-color: #E85A5A;
}

.n-select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #1B4D3E;
  display: flex;
  align-items: center;
}

.n-error {
  font-size: 12px;
  color: #E85A5A;
  margin: 0;
}

.n-hint {
  font-size: 12px;
  color: #8A8A8A;
  margin: 0;
}
</style>
