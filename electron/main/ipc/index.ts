import { app, ipcMain } from 'electron'
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
import { registerLicenseIpc } from './license.ipc'
import { UpdateService } from '../services/updates/UpdateService'
import { getSessionUser } from '../services/auth/SessionService'
import { RoleService, type Permission } from '../services/auth/RoleService'
import { AppError } from '../services/utils/errors'
import { withTrustedUserId } from './userIdArguments'

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
  registerLicenseIpc()
  registerUpdateIpc()
  logger.info('IPC handlers registered')
}

function registerAppIpc(): void {
  handle('app:version', () => ({
    app: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    platform: process.platform
  }))
  handle('app:ping', () => ({ pong: true, ts: Date.now() }))
}

const PUBLIC_CHANNELS = new Set([
  'app:version', 'app:ping',
  'auth:login', 'auth:logout', 'auth:me', 'auth:hasAnyUser', 'auth:createInitialAdmin',
  'license:getMachineId', 'license:getStatus', 'license:validate', 'license:activate'
])

const CHANNEL_PERMISSIONS: Record<string, Permission> = {
  'menu:categories:list': 'pos.use', 'menu:categories:get': 'pos.use',
  'menu:categories:create': 'menu.create', 'menu:categories:update': 'menu.update',
  'menu:categories:delete': 'menu.delete', 'menu:categories:toggle': 'menu.update',
  'menu:categories:reorder': 'menu.update',
  'menu:products:list': 'pos.use', 'menu:products:get': 'pos.use', 'menu:products:getFull': 'pos.use',
  'menu:products:create': 'menu.create', 'menu:products:update': 'menu.update',
  'menu:products:softDelete': 'menu.delete', 'menu:products:toggle': 'menu.update',
  'menu:products:upsertFull': 'menu.update',
  'menu:variants:listByProduct': 'pos.use', 'menu:variants:create': 'menu.update', 'menu:variants:delete': 'menu.update',
  'menu:modifiers:listByProduct': 'pos.use', 'menu:modifiers:create': 'menu.update', 'menu:modifiers:delete': 'menu.update',
  'menu:modifierOptions:create': 'menu.update', 'menu:modifierOptions:delete': 'menu.update',
  'menu:images:pick': 'menu.update', 'menu:images:delete': 'menu.update',
  'deals:list': 'pos.use', 'deals:get': 'pos.use', 'deals:getFull': 'pos.use', 'deals:expandToCart': 'pos.use',
  'deals:create': 'deals.manage', 'deals:update': 'deals.manage', 'deals:updateFull': 'deals.manage',
  'deals:replaceItems': 'deals.manage', 'deals:delete': 'deals.manage', 'deals:toggle': 'deals.manage',
  'orders:create': 'orders.create', 'orders:get': 'orders.view', 'orders:list': 'orders.view',
  'orders:listExtended': 'orders.view', 'orders:previewNextNumbers': 'orders.create',
  'orders:void': 'orders.void', 'orders:restore': 'orders.restore',
  'orders:listActive': 'orders.view', 'orders:markCompleted': 'orders.create',
  'print:preview': 'orders.reprint', 'print:receipt': 'orders.reprint',
  'print:test': 'settings.update', 'print:isAvailable': 'orders.reprint',
  'settings:getAll': 'settings.view', 'settings:getBusiness': 'pos.use',
  'settings:getReceipt': 'orders.reprint', 'settings:getPrinter': 'orders.reprint',
  'settings:getOrder': 'pos.use', 'settings:getSystem': 'settings.view',
  'settings:updateBusiness': 'settings.update', 'settings:updateReceipt': 'settings.update',
  'settings:updatePrinter': 'settings.update', 'settings:updateOrder': 'settings.update',
  'settings:updateSystem': 'settings.update', 'settings:set': 'settings.update',
  'settings:uploadLogo': 'settings.update', 'settings:getLogoPath': 'settings.view',
  'backup:list': 'backup.create', 'backup:create': 'backup.create', 'backup:delete': 'backup.delete',
  'backup:validate': 'backup.create', 'backup:restore': 'backup.restore',
  'backup:stats': 'backup.create', 'backup:cleanup': 'system.update',
  'export:orders': 'reports.export', 'export:products': 'reports.export',
  'export:categories': 'reports.export', 'export:payments': 'reports.export',
  'export:report': 'reports.export', 'export:fullBackup': 'backup.create',
  'reports:kpis': 'reports.view', 'reports:salesChart': 'reports.view',
  'reports:topProducts': 'reports.view', 'reports:categoryPerformance': 'reports.view',
  'reports:paymentBreakdown': 'reports.view', 'reports:itemsPerformance': 'reports.view',
  'reports:recentTransactions': 'reports.view', 'reports:score': 'reports.view',
  'reports:fullDashboard': 'reports.view',
  'license:getCurrent': 'license.view', 'license:delete': 'license.rebind',
  'update:status': 'system.update', 'update:check': 'system.update',
  'update:download': 'system.update', 'update:install': 'system.update'
}

export function handle<T>(
  channel: string,
  fn: (...args: any[]) => Promise<T> | T
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      if (!PUBLIC_CHANNELS.has(channel)) {
        const token = args.pop()
        if (typeof token !== 'string' || !token) {
          throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.')
        }
        const session = getSessionUser(token)
        if (!session) throw new AppError('UNAUTHENTICATED', 'Your session has expired. Please sign in again.')
        const permission = CHANNEL_PERMISSIONS[channel]
        if (!permission) throw new AppError('FORBIDDEN', 'This operation is not allowed.')
        RoleService.requirePermission(session.role as any, permission)
        // Never trust a renderer-supplied user ID for audit trails.
        args = withTrustedUserId(channel, args, session.id)
      }
      logger.debug({ channel }, 'IPC call')
      const result = await fn(...args)
      return { ok: true, data: result }
    } catch (err) {
      logger.error({ channel, err }, 'IPC error')
      return { ok: false, error: toIpcError(err) }
    }
  })
}

function registerUpdateIpc(): void {
  handle('update:status', () => UpdateService.getStatus())
  handle('update:check', () => UpdateService.check())
  handle('update:download', () => UpdateService.download())
  handle('update:install', () => UpdateService.install())
}
