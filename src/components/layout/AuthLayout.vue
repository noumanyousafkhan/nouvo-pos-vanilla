<template>
  <div class="auth-layout">
    <div class="auth-card">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5F1E8 0%, #FFFFFF 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 40px;
  width: 100%;
  max-width: 440px;
}
</style>
