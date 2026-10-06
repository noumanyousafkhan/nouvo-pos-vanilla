<template>
  <label :class="classes">
    <slot />
    <span v-if="required" class="text-nouvo-red ml-0.5">*</span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ required?: boolean }>(),
  { required: false }
)

const classes = computed(() => 'block text-xs font-semibold text-nouvo-ink mb-1.5')
</script>
