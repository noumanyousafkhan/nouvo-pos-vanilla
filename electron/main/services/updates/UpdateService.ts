import { autoUpdater, type UpdateInfo, type ProgressInfo } from 'electron-updater'
import { app } from 'electron'
import { logger } from '../utils/logger'
import { SettingsService } from '../settings/SettingsService'

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error'
  currentVersion: string
  availableVersion: string | null
  percent: number
  message: string
  error: string | null
}

let status: UpdateStatus = {
  state: 'idle',
  currentVersion: app.getVersion(),
  availableVersion: null,
  percent: 0,
  message: 'Updates have not been checked yet.',
  error: null
}

export class UpdateService {
  static initialize(): void {
    if (!app.isPackaged) return
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowDowngrade = false
    autoUpdater.allowPrerelease = SettingsService.getSystem().update_channel === 'beta'
    autoUpdater.logger = logger as any

    autoUpdater.on('checking-for-update', () => {
      status = { ...status, state: 'checking', message: 'Checking for updates…', error: null }
    })
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      status = { ...status, state: 'available', availableVersion: info.version, percent: 0, message: `Version ${info.version} is available.`, error: null }
      logger.info({ version: info.version }, 'Application update available')
      if (SettingsService.getBoolean('system.auto_download_updates', false)) {
        void this.download().catch((err) => logger.error({ err }, 'Automatic update download failed'))
      }
    })
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      status = { ...status, state: 'not-available', availableVersion: info.version, percent: 0, message: 'You are using the latest version.', error: null }
    })
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      status = { ...status, state: 'downloading', percent: Math.round(progress.percent), message: `Downloading update: ${Math.round(progress.percent)}%` }
    })
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      status = { ...status, state: 'downloaded', availableVersion: info.version, percent: 100, message: `Version ${info.version} is ready. Restart the app to install it.`, error: null }
    })
    autoUpdater.on('error', (err) => {
      status = { ...status, state: 'error', message: 'Could not check or download updates.', error: err.message }
      logger.error({ err }, 'Application updater error')
    })
  }

  static getStatus(): UpdateStatus {
    return { ...status, currentVersion: app.getVersion() }
  }

  static async check(): Promise<UpdateStatus> {
    if (!app.isPackaged) {
      status = { ...status, state: 'not-available', message: 'Update checks are available in the installed application only.' }
      return this.getStatus()
    }
    status = { ...status, state: 'checking', message: 'Checking for updates…', error: null }
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      status = { ...status, state: 'error', message: 'Update check failed.', error: err instanceof Error ? err.message : String(err) }
    }
    return this.getStatus()
  }

  static async download(): Promise<UpdateStatus> {
    if (!app.isPackaged) throw new Error('Updates can only be downloaded in the installed application.')
    await autoUpdater.downloadUpdate()
    return this.getStatus()
  }

  static install(): void {
    if (status.state !== 'downloaded') throw new Error('No downloaded update is ready to install.')
    autoUpdater.quitAndInstall(false, true)
  }
}
