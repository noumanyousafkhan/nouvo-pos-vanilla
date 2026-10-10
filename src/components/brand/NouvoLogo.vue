<template>
  <img
    :src="src"
    :alt="alt"
    :style="style"
    class="nouvo-logo"
    :class="{ 'nouvo-logo--rounded': rounded }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import fullLogo from '@/assets/nouvo-logo.png'
import favLogo from '@/assets/nouvo-fav.png'

interface Props {
  variant?: 'full' | 'fav'
  size?: number | string
  alt?: string
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full',
  size: 96,
  alt: 'NOUVO POS',
  rounded: false
})

const src = computed(() => (props.variant === 'fav' ? favLogo : fullLogo))

const style = computed(() => ({
  width: typeof props.size === 'number' ? `${props.size}px` : props.size,
  height: typeof props.size === 'number' ? `${props.size}px` : props.size
}))
</script>

<style scoped>
.nouvo-logo {
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}

.nouvo-logo--rounded {
  border-radius: 50%;
  background: #025726;
  /* no border */
  border: none;
  padding: 0;
}
</style>
