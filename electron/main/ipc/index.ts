import { ipcMain } from 'electron'
import { logger } from '../services/utils/logger'
import { toIpcError } from '../services/utils/errors'
import { registerAuthIpc } from './auth.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerMenuIpc } from './menu.ipc'
import { registerDealsIpc } from './deals.ipc'
import { registerOrdersIpc } from './orders.ipc'
import { registerPrintingIpc } from './printing.ipc'
import { registerReportsIpc } from './reports.ipc'
import { registerExportIpc } from './export.ipc'
import { registerBackupIpc } from './backup.ipc'

export function registerIpcHandlers(): void {
  registerAppIpc()
  registerAuthIpc()
  registerSettingsIpc()
  registerMenuIpc()
  registerDealsIpc()
  registerOrdersIpc()
  registerPrintingIpc()
  registerReportsIpc()
  registerExportIpc()
  registerBackupIpc()
  logger.info('IPC handlers registered')
}

function registerAppIpc(): void {
  handle('app:version', () => ({
    app: '0.1.0',
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    platform: process.platform
  }))
  handle('app:ping', () => ({ pong: true, ts: Date.now() }))
}

export function handle<T>(
  channel: string,
  fn: (...args: any[]) => Promise<T> | T
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      logger.debug({ channel }, 'IPC call')
      const result = await fn(...args)
      return { ok: true, data: result }
    } catch (err) {
      logger.error({ channel, err }, 'IPC error')
      return { ok: false, error: toIpcError(err) }
    }
  })
}
