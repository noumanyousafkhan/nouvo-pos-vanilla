<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="n-button-spinner"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  full?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  full: false
})

defineEmits<{ click: [MouseEvent] }>()

const classes = computed(() => {
  const base =
    'n-button inline-flex items-center justify-center gap-2 font-semibold rounded-button transition-colors duration-150 focus:outline-none'

  // NO active:scale — it breaks cursor hit-testing
  const variants: Record<string, string> = {
    primary: 'bg-nouvo-green text-white hover:bg-nouvo-green-dark',
    secondary:
      'bg-white text-nouvo-ink border border-nouvo-gray-border hover:bg-nouvo-cream',
    danger: 'bg-nouvo-red text-white hover:bg-red-600',
    ghost: 'bg-transparent text-nouvo-green hover:bg-nouvo-cream'
  }

  const sizes: Record<string, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  }

  const state =
    props.disabled || props.loading ? 'opacity-50' : ''

  return [
    base,
    variants[props.variant],
    sizes[props.size],
    props.full ? 'w-full' : '',
    state
  ].join(' ')
})
</script>

<style scoped>
.n-button {
  cursor: pointer;
  user-select: none;
  -webkit-appearance: none;
  appearance: none;
}

.n-button:disabled {
  cursor: not-allowed !important;
}

.n-button > * {
  pointer-events: none;
}

.n-button-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: n-spin 0.6s linear infinite;
}

@keyframes n-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
