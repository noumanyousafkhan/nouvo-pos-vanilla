<template>
  <div class="activation-root">
    <div class="activation-card">
      <div class="activation-header">
        <div class="logo">
          <NouvoLogo variant="full" :size="140" />
        </div>
        <h1 class="title">Activate NOUVO POS</h1>
        <p class="subtitle">VANILLA</p>
      </div>

      <div v-if="error" class="alert alert--error">
        <strong>Activation Failed</strong>
        <p>{{ error }}</p>
      </div>

      <div v-if="success" class="alert alert--success">
        <strong>✅ Activated!</strong>
        <p>Redirecting...</p>
      </div>

      <div class="machine-box">
        <div class="machine-box__label">Your Machine ID</div>
        <div class="machine-box__value">{{ machineId || 'Loading...' }}</div>
        <button class="machine-box__copy" @click="copyMachineId">
          <span v-if="!copied">📋 Copy</span>
          <span v-else>✅ Copied</span>
        </button>
      </div>

      <p class="hint">
        Send this Machine ID to your vendor to receive a license.
      </p>

      <div class="divider">
        <span>Paste your license</span>
      </div>

      <div class="option">
        <textarea
          v-model="licenseInput"
          placeholder="Paste the license string here..."
          class="license-textarea"
          rows="6"
        />
        <button
          class="btn btn--primary btn--full"
          :disabled="!licenseInput.trim() || activating"
          @click="activate"
        >
          {{ activating ? 'Activating...' : 'Activate' }}
        </button>
      </div>

      <div class="footer">
        <span class="version">v0.1.0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NouvoLogo from '@/components/brand/NouvoLogo.vue'

const router = useRouter()

const machineId = ref('')
const error = ref('')
const success = ref(false)
const copied = ref(false)
const licenseInput = ref('')
const activating = ref(false)

onMounted(async () => {
  try {
    const res = await (window as any).nouvo.invoke('license:getMachineId')
    if (res?.ok && res.data) {
      machineId.value = res.data.formatted || res.data.raw || ''
    }
  } catch {
    error.value = 'Could not read machine ID'
  }
})

async function copyMachineId() {
  try {
    await navigator.clipboard.writeText(machineId.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
}

async function activate() {
  error.value = ''
  success.value = false

  const raw = licenseInput.value.trim()
  if (!raw) {
    error.value = 'Please paste your license'
    return
  }

  activating.value = true
  try {
    const res = await (window as any).nouvo.invoke('license:activate', raw)
    if (res?.ok) {
      success.value = true
      setTimeout(() => router.push('/login'), 1500)
    } else {
      error.value = res?.error?.message || 'Activation failed'
    }
  } catch (err: any) {
    error.value = err?.message || 'Activation failed'
  } finally {
    activating.value = false
  }
}
</script>

<style scoped>
.activation-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 24px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-y: auto;
}

.activation-card {
  width: 100%;
  max-width: 560px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08);
  border: 1px solid #E0DAD0;
  margin: auto;
}

.activation-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #1B4D3E;
  margin: 0 0 4px 0;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 11px;
  font-weight: 600;
  color: #7BA88C;
  letter-spacing: 4px;
  margin: 0;
}

.machine-box {
  background: #F5F1E8;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  position: relative;
}

.machine-box__label {
  font-size: 10px;
  font-weight: 600;
  color: #8A8A8A;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.machine-box__value {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: #1A1A1A;
  word-break: break-all;
  line-height: 1.5;
  font-weight: 600;
  padding-right: 80px;
}

.machine-box__copy {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #025726;
  color: #FFFFFF;
  border: none;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.hint {
  font-size: 11px;
  color: #8A8A8A;
  text-align: center;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #E0DAD0;
}

.divider span {
  font-size: 11px;
  color: #8A8A8A;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.option { margin-bottom: 8px; }

.license-textarea {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1.5px solid #E0DAD0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 11px;
  outline: none;
  resize: vertical;
  margin-bottom: 10px;
  line-height: 1.4;
  word-break: break-all;
  background: #FFFFFF;
}

.license-textarea:focus {
  border-color: #025726;
  box-shadow: 0 0 0 3px rgba(2, 87, 38, 0.12);
}

.btn {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.15s;
}

.btn--full { width: 100%; }

.btn--primary {
  background: #025726;
  color: #FFFFFF;
}

.btn--primary:hover:not(:disabled) { background: #014020; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.alert {
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 14px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-line;
}

.alert--error {
  background: #FCEAEA;
  color: #8B1E1E;
  border-left: 4px solid #E85A5A;
}

.alert--success {
  background: #E8F2EC;
  color: #025726;
  border-left: 4px solid #025726;
}

.alert strong {
  display: block;
  margin-bottom: 3px;
}

.footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #E0DAD0;
}

.version { font-size: 11px; color: #8A8A8A; }
</style>
