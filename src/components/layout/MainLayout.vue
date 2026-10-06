<template>
  <div class="main-layout">
    <header class="main-header">
      <div class="header-left">
        <div class="logo-mark">N</div>
        <span class="brand">NOUVO POS</span>
      </div>
      <div class="header-right">
        <slot name="header-actions" />
        <span class="version">v0.1.0</span>
      </div>
    </header>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F5F1E8;
}

.main-header {
  height: 64px;
  background: #1B4D3E;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F5F1E8;
  color: #1B4D3E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.version {
  font-size: 12px;
  opacity: 0.7;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
