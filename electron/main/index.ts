import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { registerIpcHandlers } from './ipc'
import { initDatabase, closeDatabase } from './services/database/Database'
import { runMigrations } from './services/database/Migrator'
import { cleanupExpiredSessions } from './services/auth/SessionService'
import { logger } from './services/utils/logger'
import { getAppPaths } from './services/utils/paths'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

// ─── Register custom protocol for local files ───
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'nouvo-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
])

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
