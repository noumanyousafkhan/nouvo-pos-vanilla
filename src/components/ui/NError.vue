<template>
  <p v-if="message" class="n-error">
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<style scoped>
.n-error {
  color: #E85A5A;
  background: #FFE5E5;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin: 12px 0 0;
}
</style>
