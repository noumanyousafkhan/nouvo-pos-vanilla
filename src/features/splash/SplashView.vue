<template>
  <div class="splash-root">
    <div class="splash-content">
      <div class="logo-wrap">
        <NouvoLogo variant="full" :size="240" />
      </div>

      <div class="brand-text">
        <h1 class="product-name">NOUVO POS</h1>
        <p class="product-sub">VANILLA</p>
      </div>

      <div class="infinity-loader">
        <svg viewBox="0 0 100 40" class="infinity-svg">
          <path
            d="M 25,20 C 25,10 40,10 50,20 C 60,30 75,30 75,20 C 75,10 60,10 50,20 C 40,30 25,30 25,20 Z"
            fill="none"
            stroke="#1B4D3E"
            stroke-width="3"
            stroke-linecap="round"
            class="infinity-path"
          />
        </svg>
      </div>

      <p class="version">v0.1.0</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NouvoLogo from '@/components/brand/NouvoLogo.vue'

const router = useRouter()

onMounted(async () => {
  const start = Date.now()
  const MIN_SPLASH = 3000

  try {
    const licRes = await (window as any).nouvo.invoke('license:validate')
    const licenseValid = licRes?.ok && licRes.data?.status === 'valid'

    if (!licenseValid) {
      const elapsed = Date.now() - start
      if (elapsed < MIN_SPLASH) {
        await new Promise((r) => setTimeout(r, MIN_SPLASH - elapsed))
      }
      router.push('/activate')
      return
    }

    const hasUsersRes = await (window as any).nouvo.invoke('auth:hasAnyUser')
    const hasUsers = hasUsersRes?.ok && hasUsersRes.data === true

    const elapsed = Date.now() - start
    if (elapsed < MIN_SPLASH) {
      await new Promise((r) => setTimeout(r, MIN_SPLASH - elapsed))
    }

    if (!hasUsers) {
      router.push('/setup')
    } else {
      router.push('/login')
    }
  } catch (err) {
    console.error('Splash error:', err)
    router.push('/activate')
  }
})
</script>

<style scoped>
.splash-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
}

.splash-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
}

.product-name {
  font-size: 32px;
  font-weight: 700;
  color: #1B4D3E;
  margin: 0;
  letter-spacing: 1.5px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
}

.product-sub {
  font-size: 13px;
  font-weight: 500;
  color: #7BA88C;
  margin: 0;
  letter-spacing: 5px;
}

.infinity-loader {
  width: 100px;
  height: 40px;
  margin-top: 32px;
}

.infinity-svg {
  width: 100%;
  height: 100%;
}

.infinity-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: draw 1.5s ease-in-out infinite;
}

@keyframes draw {
  0% { stroke-dashoffset: 200; }
  50% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -200; }
}

.version {
  font-size: 12px;
  color: #8A8A8A;
  margin-top: 24px;
}
</style>
