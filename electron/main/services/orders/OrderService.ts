import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { NumberGenerator } from './NumberGenerator'
import { CreateOrderSchema, OrderFiltersSchema } from './schemas'
import { OrderHistoryFiltersSchema, VoidOrderSchema } from './historySchemas'
import { AppError, NotFoundError } from '../utils/errors'
import { SettingsService } from '../settings/SettingsService'
import { logger } from '../utils/logger'

export class OrderService {
  static createOrder(data: unknown, userId?: number) {
    const parsed = CreateOrderSchema.parse(data)
    const db = getDatabase()

    const existingLog = db.prepare(
      'SELECT id FROM audit_logs WHERE action = ? AND details LIKE ? LIMIT 1'
    ).get('order.created', `%"idempotencyKey":"${parsed.idempotencyKey}"%`) as { id: number } | undefined

    if (existingLog) {
      const existingOrder = db.prepare(
        `SELECT id FROM orders WHERE id = (
          SELECT CAST(json_extract(details, '$.orderId') AS INTEGER)
          FROM audit_logs WHERE id = ?
        )`
      ).get(existingLog.id) as { id: number } | undefined

      if (existingOrder) {
        logger.warn({ idempotencyKey: parsed.idempotencyKey }, 'Duplicate order prevented')
        return this.getFullOrder(existingOrder.id)
      }
    }

    this.validateOrder(parsed)

    const tx = db.transaction(() => {
      const orderPrefix = SettingsService.get('order.order_prefix') ?? 'ORD'
      const invoicePrefix = SettingsService.get('order.invoice_prefix') ?? 'INV'
      const orderNumber = NumberGenerator.nextOrderNumber(orderPrefix)
      const invoiceNumber = NumberGenerator.nextInvoiceNumber(invoicePrefix)

      const change = parsed.paymentMethod === 'cash'
        ? Math.max(0, parsed.amountReceived - parsed.total)
        : 0

      const orderResult = db.prepare(`
        INSERT INTO orders (
          order_number, invoice_number, order_type,
          customer_name, customer_phone, customer_address, table_number,
          subtotal, discount, delivery_charge, tax, total,
          payment_method, amount_received, change, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now', 'localtime'))
      `).run(
        orderNumber, invoiceNumber, parsed.orderType,
        parsed.customerName, parsed.customerPhone, parsed.customerAddress, parsed.tableNumber,
        parsed.subtotal, parsed.discount, parsed.deliveryCharge, parsed.tax, parsed.total,
        parsed.paymentMethod, parsed.amountReceived, change
      )

      const orderId = Number(orderResult.lastInsertRowid)
      const itemIds: number[] = []

      for (const item of parsed.items) {
        const r = db.prepare(`
          INSERT INTO order_items (
            order_id, product_id, variant_id, deal_id,
            product_name, variant_name, unit_price, quantity, line_total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId, item.productId, item.variantId ?? null, item.dealId ?? null,
          item.productName, item.variantName ?? null,
          item.unitPrice, item.quantity, item.lineTotal, item.notes ?? ''
        )
        itemIds.push(Number(r.lastInsertRowid))
      }

      for (let i = 0; i < parsed.items.length; i++) {
        const item = parsed.items[i]
        const orderItemId = itemIds[i]
        for (const mod of item.modifiers) {
          db.prepare(`
            INSERT INTO order_item_modifiers (order_item_id, modifier_name, option_name, price)
            VALUES (?, ?, ?, ?)
          `).run(orderItemId, mod.modifierName, mod.optionName, mod.price)
        }
      }

      db.prepare('INSERT INTO payments (order_id, method, amount) VALUES (?, ?, ?)')
        .run(orderId, parsed.paymentMethod, parsed.total)

      return { orderId, orderNumber, invoiceNumber }
    })

    const result = tx()

    AuditService.log('order.created', {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      invoiceNumber: result.invoiceNumber,
      total: parsed.total,
      itemCount: parsed.items.length,
      idempotencyKey: parsed.idempotencyKey
    }, userId)

    return this.getFullOrder(result.orderId)
  }

  private static validateOrder(parsed: any) {
    const orderSettings = SettingsService.getOrder()

    if (parsed.orderType === 'delivery' && orderSettings.require_customer_for_delivery) {
      if (!parsed.customerPhone || !parsed.customerAddress) {
        throw new AppError('VALIDATION', 'Delivery requires customer phone and address')
      }
    }

    if (parsed.orderType === 'dine_in' && orderSettings.require_table_for_dine_in) {
      if (!parsed.tableNumber) throw new AppError('VALIDATION', 'Dine-In requires table number')
    }

    if (parsed.discount > parsed.subtotal) {
      throw new AppError('VALIDATION', 'Discount cannot exceed subtotal')
    }

    if (parsed.paymentMethod === 'cash' && parsed.amountReceived < parsed.total) {
      throw new AppError('VALIDATION', 'Amount received is less than total')
    }

    const computed = parsed.subtotal - parsed.discount + parsed.tax + parsed.deliveryCharge
    if (Math.abs(computed - parsed.total) > 0.01) {
      throw new AppError('VALIDATION', 'Total does not match')
    }
  }

  static getFullOrder(orderId: number) {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) throw new NotFoundError('Order not found')

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId) as any[]

    const itemsWithModifiers = items.map((item) => ({
      ...item,
      modifiers: db.prepare('SELECT * FROM order_item_modifiers WHERE order_item_id = ?').all(item.id)
    }))

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId)

    return { order, items: itemsWithModifiers, payment }
  }

  static listOrders(filters: unknown) {
    const parsed = OrderFiltersSchema.parse(filters)
    const db = getDatabase()

    const conditions: string[] = []
    const params: any[] = []

    if (parsed.dateFrom) { conditions.push('created_at >= ?'); params.push(parsed.dateFrom) }
    if (parsed.dateTo) { conditions.push('created_at <= ?'); params.push(parsed.dateTo) }
    if (parsed.orderType) { conditions.push('order_type = ?'); params.push(parsed.orderType) }
    if (parsed.paymentMethod) { conditions.push('payment_method = ?'); params.push(parsed.paymentMethod) }
    if (parsed.search) {
      conditions.push('(order_number LIKE ? OR invoice_number LIKE ? OR customer_name LIKE ?)')
      const s = `%${parsed.search}%`
      params.push(s, s, s)
    }

    let sql = 'SELECT * FROM orders'
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const mainParams = [...params, parsed.limit, parsed.offset]

    const rows = db.prepare(sql).all(...mainParams) as any[]

    let countSql = 'SELECT COUNT(*) as c FROM orders'
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ')
    const countRow = db.prepare(countSql).get(...params) as { c: number }

    return { orders: rows, total: countRow.c }
  }

  static listOrdersExtended(filters: unknown) {
    const parsed = OrderHistoryFiltersSchema.parse(filters)
    const db = getDatabase()

    const conditions: string[] = []
    const params: any[] = []

    if (parsed.status === 'voided') {
      conditions.push("status = 'voided'")
    } else if (!parsed.includeVoided) {
      conditions.push("status != 'voided'")
    }

    if (parsed.range !== 'custom' && parsed.range !== 'all') {
      const range = this.getRangeDates(parsed.range)
      if (range.from) { conditions.push('created_at >= ?'); params.push(range.from) }
      if (range.to) { conditions.push('created_at <= ?'); params.push(range.to) }
    } else if (parsed.range === 'custom') {
      if (parsed.dateFrom) { conditions.push('created_at >= ?'); params.push(parsed.dateFrom) }
      if (parsed.dateTo) { conditions.push('created_at <= ?'); params.push(parsed.dateTo) }
    }

    if (parsed.orderType) { conditions.push('order_type = ?'); params.push(parsed.orderType) }
    if (parsed.paymentMethod) { conditions.push('payment_method = ?'); params.push(parsed.paymentMethod) }

    if (parsed.search) {
      conditions.push('(order_number LIKE ? OR invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)')
      const s = `%${parsed.search}%`
      params.push(s, s, s, s)
    }

    let sql = 'SELECT * FROM orders'
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    const sortCol = parsed.sortBy === 'order_number' ? 'order_number'
      : parsed.sortBy === 'total' ? 'total'
      : 'created_at'
    sql += ` ORDER BY ${sortCol} ${parsed.sortDir === 'asc' ? 'ASC' : 'DESC'}`
    sql += ' LIMIT ? OFFSET ?'

    const mainParams = [...params, parsed.limit, parsed.offset]
    const orders = db.prepare(sql).all(...mainParams) as any[]

    let countSql = 'SELECT COUNT(*) as c FROM orders'
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ')
    const countRow = db.prepare(countSql).get(...params) as { c: number }

    let statsSql = `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue, COALESCE(AVG(total), 0) as avg_order FROM orders`
    if (conditions.length > 0) statsSql += ' WHERE ' + conditions.join(' AND ')
    const stats = db.prepare(statsSql).get(...params) as any

    return {
      orders,
      total: countRow.c,
      limit: parsed.limit,
      offset: parsed.offset,
      stats: {
        count: stats.count,
        revenue: stats.revenue,
        avg_order: stats.avg_order
      }
    }
  }

  private static getRangeDates(range: string): { from: string | null; to: string | null } {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (range) {
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
      default:
        return { from: null, to: null }
    }

    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    return { from: fmt(start), to: fmt(end) }
  }

  static voidOrderExtended(data: unknown, userId?: number) {
    const parsed = VoidOrderSchema.parse(data)
    const db = getDatabase()

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(parsed.orderId) as any
    if (!order) throw new NotFoundError('Order not found')
    if (order.status === 'voided') throw new AppError('ALREADY_VOIDED', 'Order is already voided')

    db.prepare("UPDATE orders SET status = 'voided' WHERE id = ?").run(parsed.orderId)

    AuditService.log('order.voided', {
      orderId: parsed.orderId,
      orderNumber: order.order_number,
      reason: parsed.reason,
      total: order.total
    }, userId)

    return this.getFullOrder(parsed.orderId)
  }

  static restoreOrder(orderId: number, userId?: number) {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) throw new NotFoundError('Order not found')
    if (order.status !== 'voided') throw new AppError('NOT_VOIDED', 'Order is not voided')

    db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(orderId)
    AuditService.log('order.restored', { orderId, orderNumber: order.order_number }, userId)
    return this.getFullOrder(orderId)
  }

  static previewNextNumbers() {
    const db = getDatabase()
    const now = new Date()
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const orderPrefix = SettingsService.get('order.order_prefix') ?? 'ORD'
    const invoicePrefix = SettingsService.get('order.invoice_prefix') ?? 'INV'

    const orderRow = db.prepare('SELECT last_number FROM order_counter WHERE prefix = ? AND date_key = ?')
      .get(orderPrefix, dateKey) as { last_number: number } | undefined
    const invoiceRow = db.prepare('SELECT last_number FROM invoice_counter WHERE prefix = ?')
      .get(invoicePrefix) as { last_number: number } | undefined

    return {
      orderNumber: `${orderPrefix}-${dateKey}-${String((orderRow?.last_number ?? 0) + 1).padStart(4, '0')}`,
      invoiceNumber: `${invoicePrefix}-${String((invoiceRow?.last_number ?? 0) + 1).padStart(4, '0')}`
    }
  }
}
