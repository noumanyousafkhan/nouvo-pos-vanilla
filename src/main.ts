import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// ============================================
// CURSOR REFRESH FORCE (Electron Chromium bug)
// ============================================

// Force cursor re-evaluation on hover
document.addEventListener(
  'mousemove',
  (() => {
    let lastTarget: Element | null = null
    return (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target !== lastTarget) {
        lastTarget = target
        // Force style recalculation on the hovered element
        if (target instanceof HTMLElement) {
          // Tiny transform forces Chromium to re-evaluate cursor
          target.style.setProperty('--cursor-refresh', '1')
          requestAnimationFrame(() => {
            target.style.removeProperty('--cursor-refresh')
          })
        }
      }
    }
  })(),
  { passive: true }
)

// Force cursor refresh on window focus
window.addEventListener('focus', () => {
  document.body.style.transform = 'translateZ(0)'
  requestAnimationFrame(() => {
    document.body.style.transform = ''
  })
})
