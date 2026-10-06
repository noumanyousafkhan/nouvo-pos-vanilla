<template>
  <div class="space-y-6">
    <!-- System Settings -->
    <div>
      <h2 class="text-xl font-semibold text-nouvo-green mb-5">System Settings</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NInput v-model.number="form.backup_retention_days" label="Backup Retention (days)" type="number" />
        <NInput v-model="form.backup_time" label="Backup Time (HH:MM)" />
        <NSelect v-model="form.update_channel" label="Update Channel" :options="channelOptions" />
        <NSelect v-model="form.date_format" label="Date Format" :options="dateFormatOptions" />
        <NSelect v-model="form.time_format" label="Time Format" :options="timeFormatOptions" />
      </div>

      <div class="mt-5 flex flex-wrap gap-4">
        <NCheckbox v-model="form.backup_enabled" label="Backup Enabled" />
        <NCheckbox v-model="form.auto_check_updates" label="Auto Check Updates" />
        <NCheckbox v-model="form.auto_download_updates" label="Auto Download Updates" />
      </div>

      <div class="mt-6 flex justify-end">
        <NButton :loading="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</NButton>
      </div>

      <p v-if="message" class="mt-3 text-sm" :class="messageType === 'success' ? 'text-nouvo-green' : 'text-nouvo-red'">{{ message }}</p>
    </div>

    <!-- BACKUP & RESTORE -->
    <div class="border-t-2 border-nouvo-gray-border/40 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-nouvo-green">Backup & Restore</h2>
        <NButton :loading="creatingBackup" @click="createBackup">
          {{ creatingBackup ? 'Creating...' : '💾 Backup Now' }}
        </NButton>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div class="bg-nouvo-cream rounded-xl p-3">
          <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Total Backups</div>
          <div class="text-[18px] font-bold text-nouvo-green">{{ backups.length }}</div>
        </div>
        <div class="bg-nouvo-cream rounded-xl p-3">
          <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Last Backup</div>
          <div class="text-[12px] font-semibold text-nouvo-ink">{{ lastBackupDate }}</div>
        </div>
        <div class="bg-nouvo-cream rounded-xl p-3">
          <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Retention</div>
          <div class="text-[18px] font-bold text-nouvo-green">{{ form.backup_retention_days }} days</div>
        </div>
        <div class="bg-nouvo-cream rounded-xl p-3">
          <div class="text-[10px] font-bold text-nouvo-gray uppercase tracking-wider mb-1">Auto Backup</div>
          <div class="text-[13px] font-bold" :class="form.backup_enabled ? 'text-nouvo-green' : 'text-nouvo-red'">
            {{ form.backup_enabled ? '✅ On' : '❌ Off' }}
          </div>
        </div>
      </div>

      <!-- Backups list -->
      <div v-if="loadingBackups" class="text-center text-nouvo-gray py-8 text-sm">Loading backups...</div>
      <div v-else-if="backups.length === 0" class="text-center text-nouvo-gray py-8 text-sm">
        No backups yet. Click "Backup Now" to create one.
      </div>
      <div v-else class="bg-white border border-nouvo-gray-border rounded-xl overflow-hidden">
        <table class="w-full border-collapse text-[12px]">
          <thead class="bg-nouvo-cream">
            <tr>
              <th class="text-left px-3 py-2 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Date & Time</th>
              <th class="text-left px-3 py-2 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Type</th>
              <th class="text-right px-3 py-2 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Size</th>
              <th class="text-right px-3 py-2 text-[10px] font-bold text-nouvo-green uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in backups" :key="b.id" class="border-t border-nouvo-gray-border/40">
              <td class="px-3 py-2 text-nouvo-ink">{{ formatDate(b.created_at) }}</td>
              <td class="px-3 py-2">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="b.type === 'auto' ? 'bg-nouvo-green/10 text-nouvo-green' : b.type === 'manual' ? 'bg-nouvo-gold/20 text-nouvo-gold' : 'bg-nouvo-red/10 text-nouvo-red'"
                >{{ b.type }}</span>
              </td>
              <td class="px-3 py-2 text-right font-mono text-nouvo-gray">{{ formatSize(b.size) }}</td>
              <td class="px-3 py-2 text-right">
                <button
                  class="cursor-pointer text-nouvo-green hover:bg-nouvo-green/10 px-2 py-1 rounded text-[11px] font-semibold mr-1"
                  @click="restoreBackup(b)"
                  title="Restore"
                >↻ Restore</button>
                <button
                  class="cursor-pointer text-nouvo-red hover:bg-nouvo-red/10 px-2 py-1 rounded text-[11px] font-semibold"
                  @click="deleteBackup(b)"
                  title="Delete"
                >✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invokeSafe } from '@/utils/ipc'
import { useSettingsStore } from '@/stores/settings'
import NInput from '@/components/ui/NInput.vue'
import NSelect from '@/components/ui/NSelect.vue'
import NButton from '@/components/ui/NButton.vue'
import NCheckbox from '@/components/ui/NCheckbox.vue'

const store = useSettingsStore()
const form = ref<any>({ ...store.system })
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const backups = ref<any[]>([])
const loadingBackups = ref(false)
const creatingBackup = ref(false)

const channelOptions = [
  { value: 'stable', label: 'Stable' },
  { value: 'beta', label: 'Beta' }
]
const dateFormatOptions = [
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
]
const timeFormatOptions = [
  { value: '12h', label: '12 Hour' },
  { value: '24h', label: '24 Hour' }
]

const lastBackupDate = computed(() => {
  if (backups.value.length === 0) return '—'
  const latest = backups.value[0]
  return formatDate(latest.created_at)
})

async function save() {
  saving.value = true
  message.value = ''
  const res = await store.updateSystem({ ...form.value })
  saving.value = false
  if (res.ok) {
    message.value = 'Saved'
    messageType.value = 'success'
  } else {
    message.value = (res as any).error?.message || 'Save failed'
    messageType.value = 'error'
  }
}

async function loadBackups() {
  loadingBackups.value = true
  const res = await invokeSafe<any[]>('backup:list')
  loadingBackups.value = false
  if (res.ok && Array.isArray(res.data)) {
    backups.value = res.data
  } else {
    backups.value = []
  }
}

async function createBackup() {
  creatingBackup.value = true
  const res = await invokeSafe('backup:create', { type: 'manual', note: 'Manual backup' })
  creatingBackup.value = false
  if (res.ok) {
    message.value = 'Backup created'
    messageType.value = 'success'
    await loadBackups()
  } else {
    message.value = (res as any).error?.message || 'Backup failed'
    messageType.value = 'error'
  }
}

async function restoreBackup(b: any) {
  if (!confirm(`Restore backup from ${formatDate(b.created_at)}?\n\nCurrent data will be preserved as a pre-restore backup.\nUsers will stay logged in.`)) {
    return
  }
  const res = await invokeSafe('backup:restore', { backupId: b.id, confirm: true })
  if (res.ok) {
    alert('Restore successful. Please restart the application.')
    window.location.reload()
  } else {
    alert((res as any).error?.message || 'Restore failed')
  }
}

async function deleteBackup(b: any) {
  if (!confirm(`Delete backup from ${formatDate(b.created_at)}?`)) return
  const res = await invokeSafe('backup:delete', b.id)
  if (res.ok) {
    await loadBackups()
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(() => {
  form.value = { ...store.system }
  loadBackups()
})
</script>
