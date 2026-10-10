import { contextBridge, ipcRenderer } from 'electron'

const INVOKE_CHANNELS = [
  'app:version', 'app:ping',
  // Auth
  'auth:login', 'auth:logout', 'auth:me', 'auth:hasAnyUser', 'auth:createInitialAdmin',
  // Settings
  'settings:getAll', 'settings:getBusiness', 'settings:getReceipt', 'settings:getPrinter',
  'settings:getOrder', 'settings:getSystem',
  'settings:updateBusiness', 'settings:updateReceipt', 'settings:updatePrinter',
  'settings:updateOrder', 'settings:updateSystem',
  'settings:set', 'settings:uploadLogo', 'settings:getLogoPath',
  // Menu
  'menu:categories:list', 'menu:categories:get', 'menu:categories:create',
  'menu:categories:update', 'menu:categories:delete', 'menu:categories:toggle',
  'menu:categories:reorder',
  'menu:products:list', 'menu:products:get', 'menu:products:getFull',
  'menu:products:create', 'menu:products:update', 'menu:products:softDelete',
  'menu:products:toggle', 'menu:products:upsertFull',
  'menu:variants:listByProduct', 'menu:variants:create', 'menu:variants:delete',
  'menu:modifiers:listByProduct', 'menu:modifiers:create', 'menu:modifiers:delete',
  'menu:modifierOptions:create', 'menu:modifierOptions:delete',
  'menu:images:pick', 'menu:images:delete',
  // Deals
  'deals:list', 'deals:get', 'deals:getFull', 'deals:create',
  'deals:update', 'deals:updateFull', 'deals:replaceItems', 'deals:delete',
  'deals:toggle', 'deals:expandToCart',
  // Orders
  'orders:create', 'orders:get', 'orders:list', 'orders:listExtended',
  'orders:previewNextNumbers', 'orders:void', 'orders:restore',
  'orders:listActive', 'orders:markCompleted',
  // Printing
  'print:preview', 'print:receipt', 'print:test', 'print:isAvailable',
  // Reports
  'reports:kpis', 'reports:salesChart', 'reports:topProducts',
  'reports:categoryPerformance', 'reports:paymentBreakdown',
  'reports:itemsPerformance', 'reports:recentTransactions',
  'reports:score', 'reports:fullDashboard',
  // License
  'license:getMachineId', 'license:getStatus', 'license:getCurrent',
  'license:validate', 'license:activate', 'license:delete',
  // Backup
  'backup:list', 'backup:create', 'backup:delete', 'backup:validate',
  'backup:restore', 'backup:stats', 'backup:cleanup',
  // Export
  'export:orders', 'export:products', 'export:categories',
  'export:payments', 'export:report', 'export:fullBackup'
] as const

type InvokeChannel = typeof INVOKE_CHANNELS[number]

const api = {
  invoke: (channel: InvokeChannel, ...args: unknown[]) => {
    if (!INVOKE_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`Channel "${channel}" is not allowed`))
    }
    return ipcRenderer.invoke(channel, ...args)
  }
}

contextBridge.exposeInMainWorld('nouvo', api)
export type NouvoApi = typeof api
