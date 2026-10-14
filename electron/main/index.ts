import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { registerIpcHandlers } from './ipc'
import { initDatabase, closeDatabase } from './services/database/Database'
import { runMigrations } from './services/database/Migrator'
import { cleanupExpiredSessions } from './services/auth/SessionService'
import { logger } from './services/utils/logger'
import { getAppPaths } from './services/utils/paths'
import { BackupService } from './services/backup/BackupService'
import { SettingsService } from './services/settings/SettingsService'
import { UpdateService } from './services/updates/UpdateService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

function scheduleDailyBackup(): void {
  try {
    const settings = SettingsService.getSystem()
    const match = String(settings.backup_time || '02:00').match(/^(\d{2}):(\d{2})$/)
    const hour = match ? Number(match[1]) : 2
    const minute = match ? Number(match[2]) : 0
    if (hour > 23 || minute > 59) {
      logger.warn({ backupTime: settings.backup_time }, 'Invalid automatic backup time; using 02:00')
    }

    const now = new Date()
    const next = new Date(now)
    next.setHours(hour <= 23 ? hour : 2, minute <= 59 ? minute : 0, 0, 0)
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)

    const delay = Math.max(1000, next.getTime() - now.getTime())
    logger.info({ nextBackupAt: next.toISOString() }, 'Scheduled next automatic backup')
    setTimeout(() => {
      try {
        BackupService.runAutoBackupIfNeeded()
      } catch (err) {
        logger.error({ err }, 'Scheduled automatic backup failed')
      }
      scheduleDailyBackup()
    }, delay)
  } catch (err) {
    logger.error({ err }, 'Could not schedule automatic backup')
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#F5F1E8',
    title: 'NOUVO POS VANILLA',
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      zoomFactor: 1.0,
      enableBlinkFeatures: 'CSSVariables'
    }
  })

  mainWindow.webContents.setZoomFactor(1.0)
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1)
  mainWindow.webContents.setZoomLevel(0)

  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        (function() {
          document.body.style.transform = 'translateZ(0)';
          setTimeout(() => {
            document.body.style.transform = '';
          }, 10);
        })();
      `).catch(() => {})
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }
}

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-sandbox')

app.whenReady().then(async () => {
  logger.info('App starting...')
  try {
    const paths = getAppPaths()

    // ─── Custom protocol handler ───
    protocol.handle('nouvo-file', (request) => {
      try {
        const url = new URL(request.url)

        // nouvo-file://home/user/... → hostname='home', pathname='/user/...'
        // nouvo-file:///home/user/... → hostname='', pathname='/home/user/...'
        let filePath = url.hostname
          ? '/' + url.hostname + url.pathname
          : url.pathname

        filePath = decodeURIComponent(filePath)

        // Windows: /C:/Users/... → C:/Users/...
        if (process.platform === 'win32' && /^\/[A-Z]:/i.test(filePath)) {
          filePath = filePath.slice(1)
        }

        // Normalize slashes
        const normalized = filePath.replace(/\/+/g, '/')
        const allowedRoot = String(paths.dataRoot).replace(/\/+/g, '/')

        if (!normalized.startsWith(allowedRoot)) {
          logger.warn({ filePath, allowedRoot }, 'Blocked file access outside dataRoot')
          return new Response('Forbidden', { status: 403 })
        }

        return net.fetch(pathToFileURL(filePath).toString())
      } catch (err) {
        logger.warn({ err }, 'nouvo-file protocol error')
        return new Response('Not found', { status: 404 })
      }
    })

    logger.info({ dataRoot: paths.dataRoot }, 'App paths resolved')

    initDatabase(paths.databaseFile)
    logger.info('Database initialized')

    runMigrations()
    logger.info('Migrations complete')

    // Ensure a backup exists for today even if the PC was off at the scheduled time.
    BackupService.runAutoBackupIfNeeded()
    // Honour the configured daily backup time after migrations complete.
    scheduleDailyBackup()

    try {
      cleanupExpiredSessions()
    } catch (err) {
      logger.warn({ err }, 'Session cleanup failed')
    }

    registerIpcHandlers()

    await createWindow()
    logger.info('Window created')

    UpdateService.initialize()
    if (app.isPackaged && SettingsService.getBoolean('system.auto_check_updates', true)) {
      // Avoid competing with startup/database initialization and first render.
      setTimeout(() => {
        void UpdateService.check().catch((err) => logger.warn({ err }, 'Update check failed'))
      }, 15000)
    }
  } catch (err) {
    logger.error({ err }, 'Startup failed')
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('before-quit', () => {
  logger.info('App quitting...')
  closeDatabase()
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
