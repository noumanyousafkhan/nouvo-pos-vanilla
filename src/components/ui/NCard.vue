<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: true
})

const classes = computed(() => {
  const base = 'bg-white rounded-card'

  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const shadow = props.shadow ? 'shadow-card' : ''

  return [base, paddings[props.padding], shadow].join(' ')
})
</script>
