import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY_TOKEN = 'nouvo_auth_token'
const STORAGE_KEY_USER = 'nouvo_auth_user'

export const useAuthStore = defineStore('auth', () => {
  // Restore from localStorage on init
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
  const savedUser = localStorage.getItem(STORAGE_KEY_USER)

  const user = ref<any>(savedUser ? JSON.parse(savedUser) : null)
  const token = ref<string | null>(savedToken)
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  function persist() {
    if (token.value) localStorage.setItem(STORAGE_KEY_TOKEN, token.value)
    else localStorage.removeItem(STORAGE_KEY_TOKEN)

    if (user.value) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user.value))
    else localStorage.removeItem(STORAGE_KEY_USER)
  }

  async function login(username: string, password: string) {
    const res = await (window as any).nouvo.invoke('auth:login', username, password)
    if (res?.ok) {
      token.value = res.data.token
      user.value = res.data.user
      persist()
      return { ok: true }
    }
    return { ok: false, error: res?.error?.message || 'Login failed' }
  }

  async function logout() {
    if (token.value) {
      try {
        await (window as any).nouvo.invoke('auth:logout', token.value)
      } catch {}
    }
    user.value = null
    token.value = null
    persist()
  }

  async function restoreSession() {
    // If we already have user, no need to restore
    if (user.value && token.value) return true

    // If we have a token but no user, try to restore
    if (token.value && !user.value) {
      try {
        const res = await (window as any).nouvo.invoke('auth:me', token.value)
        if (res?.ok && res.data) {
          user.value = res.data
          persist()
          return true
        }
      } catch {}
    }

    // No valid session
    user.value = null
    token.value = null
    persist()
    return false
  }

  return { user, token, isAuthenticated, login, logout, restoreSession }
})
