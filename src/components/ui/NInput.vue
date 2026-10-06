<template>
  <div class="n-input-wrap">
    <label v-if="label" :for="inputId" class="n-label">
      {{ label }}
      <span v-if="required" class="n-required">*</span>
    </label>

    <div class="n-input-inner">
      <input
        :id="inputId"
        :type="currentType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        class="n-input"
        :class="{ 'n-input-with-toggle': passwordToggle, 'n-input-error': error }"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @keydown.enter="$emit('enter', $event)"
      />

      <button
        v-if="passwordToggle"
        type="button"
        class="n-eye-btn"
        :title="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <svg v-if="showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>

    <p v-if="error" class="n-error">{{ error }}</p>
    <p v-else-if="hint" class="n-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'search'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
  error?: string
  hint?: string
  passwordToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  autocomplete: 'off',
  error: '',
  hint: '',
  passwordToggle: false
})

const emit = defineEmits<{
  'update:modelValue': [string | number]
  blur: [FocusEvent]
  enter: [KeyboardEvent]
}>()

const inputId = useId()
const showPassword = ref(false)

const currentType = computed(() => {
  if (props.passwordToggle) {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}
</script>

<style scoped>
.n-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Label — normal arrow cursor (headings) */
.n-label {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A1A;
  cursor: default; /* ✅ Arrow cursor for headings */
  user-select: none;
}

.n-required {
  color: #E85A5A;
  margin-left: 2px;
}

.n-input-inner {
  position: relative;
  display: flex;
  align-items: center;
}

/* Input field — text cursor */
.n-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid #D0D0D0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: white;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: text;
}

.n-input::placeholder {
  color: #B0B0B0;
}

.n-input:hover:not(:disabled) {
  border-color: #B0B0B0;
}

.n-input:focus {
  border-color: #1B4D3E;
  box-shadow: 0 0 0 3px rgba(27, 77, 62, 0.08);
}

.n-input:disabled {
  background: #FAFAFA;
  cursor: not-allowed;
}

.n-input-with-toggle {
  padding-right: 48px;
}

.n-input-error {
  border-color: #E85A5A;
}

.n-input-error:focus {
  border-color: #E85A5A;
  box-shadow: 0 0 0 3px rgba(232, 90, 90, 0.08);
}

/* Eye button — pointer cursor */
.n-eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8A8A8A;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.n-eye-btn:hover {
  color: #1B4D3E;
  background: #F5F1E8;
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
