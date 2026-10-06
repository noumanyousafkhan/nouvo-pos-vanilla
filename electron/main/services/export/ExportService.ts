import { dialog } from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'
import * as XLSX from 'xlsx'
import { getDatabase } from '../database/Database'
import { getAppPaths } from '../utils/paths'
import { AuditService } from '../audit/AuditService'
import { ExportFiltersSchema } from './schemas'
import { ReportService } from '../reports/ReportService'

export class ExportService {
  private static async saveWorkbook(workbook: XLSX.WorkBook, defaultName: string): Promise<string | null> {
    const paths = getAppPaths()
    const defaultPath = join(paths.exportsDir, defaultName)

    const result = await dialog.showSaveDialog({
      title: 'Save Excel Export',
      defaultPath,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    })

    if (result.canceled || !result.filePath) return null

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(result.filePath, buffer)
    return result.filePath
  }

  private static timestamp(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  }

  private static resolveRange(parsed: any): { from: string | null; to: string | null } {
    if (parsed.range === 'all') return { from: null, to: null }
    if (parsed.range === 'custom') {
      return { from: parsed.dateFrom ?? null, to: parsed.dateTo ?? null }
    }

    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (parsed.range) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week': {
        const day = start.getDay()
        const diff = start.getDate() - day + (day === 0 ? -6 : 1)
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'year':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
    }
    return { from: start.toISOString(), to: end.toISOString() }
  }

  private static buildWhere(parsed: any, range: { from: string | null; to: string | null }): { sql: string; params: any[] } {
    const conditions: string[] = []
    const params: any[] = []

    if (!parsed.includeVoided) conditions.push("status != 'voided'")
    if (range.from) { conditions.push('created_at >= ?'); params.push(range.from) }
    if (range.to) { conditions.push('created_at <= ?'); params.push(range.to) }
    if (parsed.orderType) { conditions.push('order_type = ?'); params.push(parsed.orderType) }
    if (parsed.paymentMethod) { conditions.push('payment_method = ?'); params.push(parsed.paymentMethod) }

    const sql = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''
    return { sql, params }
  }

  static async exportOrders(filters: unknown, userId?: number): Promise<string | null> {
    const parsed = ExportFiltersSchema.parse(filters)
    const db = getDatabase()
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)

    const orders = db.prepare(`
      SELECT order_number AS "Order #", invoice_number AS "Invoice #", created_at AS "Date",
             order_type AS "Type", customer_name AS "Customer", customer_phone AS "Phone",
             customer_address AS "Address", table_number AS "Table",
             subtotal AS "Subtotal", discount AS "Discount", tax AS "Tax",
             delivery_charge AS "Delivery", total AS "Total",
             payment_method AS "Payment", amount_received AS "Received",
             change AS "Change", status AS "Status"
      FROM orders${where.sql} ORDER BY created_at DESC
    `).all(...where.params)

    const items = db.prepare(`
      SELECT o.order_number AS "Order #", o.invoice_number AS "Invoice #",
             o.created_at AS "Date", oi.product_name AS "Product",
             oi.variant_name AS "Variant", oi.unit_price AS "Unit Price",
             oi.quantity AS "Qty", oi.line_total AS "Line Total",
             oi.notes AS "Notes"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${where.sql.replace('WHERE', 'WHERE o.')}
      ORDER BY o.created_at DESC, oi.id ASC
    `).all(...where.params)

    const wb = XLSX.utils.book_new()

    const ordersWs = XLSX.utils.json_to_sheet(orders)
    ordersWs['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 20 },
      { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ordersWs, 'Orders')

    const itemsWs = XLSX.utils.json_to_sheet(items)
    itemsWs['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
      { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, itemsWs, 'Items')

    const filename = `Orders_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)

    if (path) {
      AuditService.log('export.generated', { type: 'orders', rows: orders.length + items.length, path }, userId)
    }
    return path
  }

  static async exportProducts(filters: unknown, userId?: number): Promise<string | null> {
    const parsed = ExportFiltersSchema.parse(filters)
    const db = getDatabase()

    const conditions: string[] = ['p.is_deleted = 0']
    const params: any[] = []
    if (!parsed.includeInactive) conditions.push('p.is_active = 1')
    if (parsed.categoryId) { conditions.push('p.category_id = ?'); params.push(parsed.categoryId) }

    const where = ' WHERE ' + conditions.join(' AND ')

    const rows = db.prepare(`
      SELECT p.id AS "ID", c.name AS "Category", p.name AS "Product", p.price AS "Base Price",
             CASE WHEN p.has_variants = 1 THEN 'Yes' ELSE 'No' END AS "Has Variants",
             CASE WHEN p.has_modifiers = 1 THEN 'Yes' ELSE 'No' END AS "Has Modifiers",
             CASE WHEN p.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS "Status"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY c.name, p.name
    `).all(...params)

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Products')

    const filename = `Products_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)
    if (path) AuditService.log('export.generated', { type: 'products', rows: rows.length, path }, userId)
    return path
  }

  static async exportCategories(userId?: number): Promise<string | null> {
    const db = getDatabase()
    const rows = db.prepare(`
      SELECT c.id AS "ID", c.name AS "Category", c.sort_order AS "Sort",
             CASE WHEN c.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS "Status",
             (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_deleted = 0) AS "Product Count"
      FROM categories c ORDER BY c.sort_order, c.name
    `).all()

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Categories')

    const filename = `Categories_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)
    if (path) AuditService.log('export.generated', { type: 'categories', rows: rows.length, path }, userId)
    return path
  }

  static async exportPayments(filters: unknown, userId?: number): Promise<string | null> {
    const parsed = ExportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT p.id AS "Payment ID", o.order_number AS "Order #", o.invoice_number AS "Invoice #",
             p.created_at AS "Date", p.method AS "Method", p.amount AS "Amount",
             o.customer_name AS "Customer"
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      ${where.sql.replace('WHERE', 'WHERE o.')}
      ORDER BY p.created_at DESC
    `).all(...where.params)

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Payments')

    const filename = `Payments_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)
    if (path) AuditService.log('export.generated', { type: 'payments', rows: rows.length, path }, userId)
    return path
  }

  static async exportReport(filters: unknown, userId?: number): Promise<string | null> {
    const parsed = ExportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const wb = XLSX.utils.book_new()

    // Summary sheet
    const kpis = ReportService.getKpis(parsed)
    const summary = [
      { Metric: 'Total Revenue', Value: kpis.revenue.toFixed(2) },
      { Metric: 'Total Orders', Value: kpis.orderCount },
      { Metric: 'Average Order', Value: kpis.avgOrder.toFixed(2) },
      { Metric: 'Performance', Value: kpis.performance },
      { Metric: 'Report Range', Value: parsed.range },
      { Metric: 'Generated', Value: new Date().toISOString() }
    ]
    const summaryWs = XLSX.utils.json_to_sheet(summary)
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Top Products
    const topProducts = ReportService.getTopProducts({ ...parsed, limit: 20 })
    if (topProducts.length > 0) {
      const ws = XLSX.utils.json_to_sheet(topProducts)
      ws['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Top Products')
    }

    // Category Performance
    const catPerf = ReportService.getCategoryPerformance(parsed)
    if (catPerf.length > 0) {
      const ws = XLSX.utils.json_to_sheet(catPerf)
      ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Category Performance')
    }

    // Orders
    const orders = db.prepare(`
      SELECT order_number AS "Order #", invoice_number AS "Invoice #", created_at AS "Date",
             order_type AS "Type", customer_name AS "Customer", total AS "Total",
             payment_method AS "Payment", status AS "Status"
      FROM orders${where.sql} ORDER BY created_at DESC
    `).all(...where.params)

    if (orders.length > 0) {
      const ws = XLSX.utils.json_to_sheet(orders)
      ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    }

    const filename = `Report_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)
    if (path) AuditService.log('export.generated', { type: 'report', rows: orders.length, path }, userId)
    return path
  }

  static async exportFullBackup(userId?: number): Promise<string | null> {
    const wb = XLSX.utils.book_new()
    const db = getDatabase()

    const summary = [
      { Metric: 'Generated', Value: new Date().toISOString() },
      { Metric: 'Product Version', Value: '0.1.0' }
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')

    const tables = [
      { name: 'Categories', query: 'SELECT * FROM categories ORDER BY sort_order' },
      { name: 'Products', query: 'SELECT * FROM products ORDER BY name' },
      { name: 'Orders', query: 'SELECT * FROM orders ORDER BY created_at DESC' },
      { name: 'Order Items', query: 'SELECT * FROM order_items ORDER BY id' },
      { name: 'Payments', query: 'SELECT * FROM payments ORDER BY created_at DESC' },
      { name: 'Users', query: 'SELECT id, username, role, is_active, created_at FROM users' },
      { name: 'Settings', query: 'SELECT key, value FROM settings' }
    ]

    for (const t of tables) {
      const rows = db.prepare(t.query).all()
      if (rows.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), t.name)
      }
    }

    const filename = `FullBackup_${this.timestamp()}.xlsx`
    const path = await this.saveWorkbook(wb, filename)
    if (path) AuditService.log('export.generated', { type: 'fullBackup', path }, userId)
    return path
  }
}
