<template>
  <div class="license-section">
    <div class="section-header">
      <div class="section-header__icon">🔑</div>
      <div>
        <h3 class="section-header__title">License</h3>
        <p class="section-header__subtitle">Your software license details</p>
      </div>
    </div>

    <div v-if="loading" class="state-msg">Loading...</div>

    <div v-else-if="!info || !info.valid" class="license-missing">
      <div class="alert alert--error">
        <strong>⚠️ No Valid License</strong>
        <p>{{ info?.message || 'This software is not activated.' }}</p>
      </div>
      <button class="btn btn--primary" @click="showRenew = true">
        🔑 Activate License
      </button>
    </div>

    <div v-else class="license-details">
      <div class="status-row">
        <span class="badge" :class="`badge--${warningClass}`">
          {{ warningLabel }}
        </span>
        <div class="expiry-info">
          <div class="expiry-info__days">
            {{ info.daysRemaining }} days remaining
          </div>
          <div class="expiry-info__date">
            Expires: {{ formatDate(info.expiresAt) }}
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-row">
          <div class="info-label">License ID</div>
          <div class="info-value">
            <code class="mono">{{ info.licenseId || '—' }}</code>
            <button v-if="info.licenseId" class="copy-btn" @click="copy(info.licenseId)">📋</button>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">Customer</div>
          <div class="info-value">{{ info.customer || '—' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Product</div>
          <div class="info-value">{{ info.product || 'NOUVO POS Vanilla' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Machine ID</div>
          <div class="info-value">
            <code class="mono">{{ formatMachineId(info.machineId) }}</code>
            <button v-if="info.machineId" class="copy-btn" @click="copy(info.machineId)">📋</button>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">Issued</div>
          <div class="info-value">{{ formatDate(info.issuedAt) }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expiry</div>
          <div class="info-value">{{ formatDate(info.expiresAt) }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Status</div>
          <div class="info-value">
            <span class="text-green">✓ Active</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn--primary" @click="showRenew = true">
          🔄 Renew / Update License
        </button>
        <button class="btn btn--danger" @click="showDeleteConfirm = true">
          🗑 Remove License
        </button>
      </div>
    </div>

    <!-- Renew / paste new license modal -->
    <div v-if="showRenew" class="modal-overlay" @click.self="closeRenew">
      <div class="modal">
        <h3 class="modal__title">Renew / Update License</h3>
        <p class="modal__hint">
          Paste your new license string below.
        </p>

        <div v-if="renewError" class="alert alert--error">
          <p>{{ renewError }}</p>
        </div>

        <div v-if="renewSuccess" class="alert alert--success">
          <strong>✅ License Activated!</strong>
          <p>Your license has been updated.</p>
        </div>

        <textarea
          v-model="licenseInput"
          placeholder="Paste the license string here..."
          class="license-textarea"
          rows="6"
        />

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="closeRenew">Cancel</button>
          <button
            class="btn btn--primary"
            :disabled="!licenseInput.trim() || activating"
            @click="activate"
          >
            {{ activating ? 'Activating...' : 'Activate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal modal--small">
        <div class="confirm-icon confirm-icon--danger">
          <span>⚠️</span>
        </div>
        <h3 class="modal__title modal__title--center">Remove License?</h3>
        <p class="modal__hint modal__hint--center">
          The software will become inactive immediately. You will need to
          re-import a license or paste a key to reactivate it.
        </p>

        <div class="modal__footer modal__footer--center">
          <button
            class="btn btn--secondary"
            :disabled="deleting"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            class="btn btn--danger"
            :disabled="deleting"
            @click="doDelete"
          >
            {{ deleting ? 'Removing...' : 'Yes, Remove License' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const loading = ref(true)
const info = ref<any>(null)

const showRenew = ref(false)
const licenseInput = ref('')
const activating = ref(false)
const renewError = ref('')
const renewSuccess = ref(false)

const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await (window as any).nouvo.invoke('license:getStatus')
    if (res?.ok && res.data) {
      info.value = res.data
    }
  } catch (err) {
    console.error('License load error:', err)
  } finally {
    loading.value = false
  }
}

const warningLabel = computed(() => {
  if (!info.value?.valid) return 'Not Licensed'
  const w = info.value.warning
  if (w === 'red') return '⚠️ Expires Soon'
  if (w === 'orange') return '⏰ Expiring'
  if (w === 'yellow') return '📅 Renew Soon'
  return '✓ Active'
})

const warningClass = computed(() => {
  const w = info.value?.warning
  if (w === 'red') return 'red'
  if (w === 'orange') return 'orange'
  if (w === 'yellow') return 'yellow'
  return 'green'
})

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

function formatMachineId(id?: string) {
  if (!id) return '—'
  const s = String(id)
  const groups: string[] = []
  for (let i = 0; i < s.length && i < 32; i += 4) {
    groups.push(s.slice(i, i + 4))
  }
  return groups.join('-').toUpperCase()
}

async function copy(text?: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

function closeRenew() {
  showRenew.value = false
  licenseInput.value = ''
  renewError.value = ''
  renewSuccess.value = false
}

async function activate() {
  renewError.value = ''
  renewSuccess.value = false

  const raw = licenseInput.value.trim()
  if (!raw) {
    renewError.value = 'Please paste a license'
    return
  }

  activating.value = true
  try {
    const res = await (window as any).nouvo.invoke('license:activate', raw)
    if (res?.ok) {
      renewSuccess.value = true
      await load()
      setTimeout(closeRenew, 1500)
    } else {
      renewError.value = res?.error?.message || 'Activation failed'
    }
  } catch (err: any) {
    renewError.value = err?.message || 'Activation failed'
  } finally {
    activating.value = false
  }
}

async function doDelete() {
  deleting.value = true
  try {
    const res = await (window as any).nouvo.invoke('license:delete')
    if (res?.ok) {
      showDeleteConfirm.value = false
      window.location.hash = '#/activate'
      setTimeout(() => window.location.reload(), 300)
    } else {
      deleting.value = false
    }
  } catch (err) {
    console.error('Delete failed:', err)
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.license-section {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #E0DAD0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #E0DAD0;
}

.section-header__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #E8F2EC;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.section-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #025726;
  margin: 0 0 4px 0;
}

.section-header__subtitle {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0;
}

.state-msg {
  padding: 40px;
  text-align: center;
  color: #8A8A8A;
}

.alert {
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 13px;
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
  margin-bottom: 4px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F5F1E8;
  border-radius: 12px;
  margin-bottom: 20px;
}

.badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge--green { background: #E8F2EC; color: #025726; }
.badge--yellow { background: #FDF7E3; color: #8B6F1E; }
.badge--orange { background: #FEF0E0; color: #B8630E; }
.badge--red { background: #FCEAEA; color: #8B1E1E; }

.expiry-info { flex: 1; }

.expiry-info__days {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
}

.expiry-info__date {
  font-size: 12px;
  color: #8A8A8A;
  margin-top: 2px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F0EBE0;
}

.info-row:last-child { border-bottom: none; }

.info-label {
  font-size: 11px;
  font-weight: 700;
  color: #8A8A8A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1A1A1A;
}

.mono {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  background: #F5F1E8;
  padding: 3px 8px;
  border-radius: 6px;
}

.copy-btn {
  background: #E8F2EC;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.text-green { color: #025726; font-weight: 600; }

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 20px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn--primary { background: #025726; color: #FFFFFF; }
.btn--primary:hover:not(:disabled) { background: #014020; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--secondary {
  background: #F5F1E8;
  color: #1A1A1A;
  border: 1px solid #E0DAD0;
}

.btn--secondary:hover:not(:disabled) { background: #E8E2D5; }

.btn--danger {
  background: #FCEAEA;
  color: #8B1E1E;
  border: 1px solid #E85A5A;
}

.btn--danger:hover:not(:disabled) {
  background: #F5B8B8;
  color: #FFFFFF;
}

.btn--danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--ghost { background: transparent; color: #8A8A8A; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 28px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal--small { max-width: 420px; }

.modal__title {
  font-size: 20px;
  font-weight: 700;
  color: #025726;
  margin: 0 0 8px 0;
}

.modal__title--center { text-align: center; }

.modal__hint {
  font-size: 13px;
  color: #8A8A8A;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal__hint--center {
  text-align: center;
  margin-bottom: 24px;
}

.license-textarea {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1.5px solid #E0DAD0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 11px;
  outline: none;
  resize: vertical;
  margin-bottom: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.license-textarea:focus {
  border-color: #025726;
  box-shadow: 0 0 0 3px rgba(2, 87, 38, 0.12);
}

.confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 16px;
}

.confirm-icon--danger {
  background: #FCEAEA;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid #E0DAD0;
}

.modal__footer--center {
  justify-content: center;
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}
</style>
