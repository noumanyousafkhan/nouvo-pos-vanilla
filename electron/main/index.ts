import { app, BrowserWindow, shell, screen } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { initDatabase, closeDatabase } from './services/database/Database'
import { runMigrations } from './services/database/Migrator'
import { cleanupExpiredSessions } from './services/auth/SessionService'
import { logger } from './services/utils/logger'
import { getAppPaths } from './services/utils/paths'

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#F5F1E8',
    title: 'NOUVO POS VANILLA',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      zoomFactor: 1.0,
      // Force repaint for cursor fixes
      enableBlinkFeatures: 'CSSVariables'
    }
  })

  // ============================================
  // CURSOR FIX FOR ELECTRON CHROMIUM
  // ============================================

  // Force 100% zoom (cursor hit-testing depends on this)
  mainWindow.webContents.setZoomFactor(1.0)
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1)
  mainWindow.webContents.setZoomLevel(0)

  // Force cursor refresh on window focus
  mainWindow.on('focus', () => {
    if (mainWindow) {
      // Trigger a tiny repaint to clear cursor cache
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

  // Force cursor refresh on mouse enter
  mainWindow.webContents.on('before-input-event', () => {
    // no-op, just keeps webContents active
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

app.whenReady().then(async () => {
  logger.info('App starting...')
  try {
    const paths = getAppPaths()
    logger.info({ dataRoot: paths.dataRoot }, 'App paths resolved')

    initDatabase(paths.databaseFile)
    logger.info('Database initialized')

    runMigrations()
    logger.info('Migrations complete')

    try {
      cleanupExpiredSessions()
    } catch (err) {
      logger.warn({ err }, 'Session cleanup failed')
    }

    registerIpcHandlers()

    await createWindow()
    logger.info('Window created')
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
