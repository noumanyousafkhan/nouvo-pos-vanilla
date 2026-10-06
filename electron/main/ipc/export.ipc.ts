import { handle } from './index'
import { ExportService } from '../services/export/ExportService'

export function registerExportIpc(): void {
  handle('export:orders', (filters, userId) => ExportService.exportOrders(filters, userId))
  handle('export:products', (filters, userId) => ExportService.exportProducts(filters, userId))
  handle('export:categories', (userId) => ExportService.exportCategories(userId))
  handle('export:payments', (filters, userId) => ExportService.exportPayments(filters, userId))
  handle('export:report', (filters, userId) => ExportService.exportReport(filters, userId))
  handle('export:fullBackup', (userId) => ExportService.exportFullBackup(userId))
}
