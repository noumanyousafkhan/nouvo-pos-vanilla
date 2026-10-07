import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { NumberGenerator } from './NumberGenerator'
import { CreateOrderSchema, OrderFiltersSchema } from './schemas'
import { AppError, NotFoundError } from '../utils/errors'
import { SettingsService } from '../settings/SettingsService'
import { logger } from '../utils/logger'

export interface OrderRecord {
  id: number
  order_number: string
  invoice_number: string
  order_type: string
  customer_name: string
  customer_phone: string
  customer_address: string
  table_number: string
  subtotal: number
  discount: number
  delivery_charge: number
  tax: number
  total: number
  payment_method: string
  amount_received: number
  change: number
  status: string
  created_at: string
}

export class OrderService {
  // ═══════════════════════════════════════════════════════
  // CREATE ORDER
  // ═══════════════════════════════════════════════════════
  static createOrder(data: unknown, userId?: number) {
    const parsed = CreateOrderSchema.parse(data)
    const db = getDatabase()

    // Idempotency check
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
          payment_method, amount_received, change, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `).run(
        orderNumber, invoiceNumber, parsed.orderType,
        parsed.customerName, parsed.customerPhone, parsed.customerAddress, parsed.tableNumber,
        parsed.subtotal, parsed.discount, parsed.deliveryCharge, parsed.tax, parsed.total,
        parsed.paymentMethod, parsed.amountReceived, change
      )

      const orderId = Number(orderResult.lastInsertRowid)
      const itemIds: number[] = []

      for (const item of parsed.items) {
        // Serialize dealChildren into notes
        const anyItem = item as any
        const notesPayload = anyItem.dealChildren && anyItem.dealChildren.length > 0
          ? JSON.stringify({ _type: 'deal_children', children: anyItem.dealChildren })
          : (item.notes ?? '')

        const itemResult = db.prepare(`
          INSERT INTO order_items (
            order_id, product_id, variant_id, deal_id,
            product_name, variant_name, unit_price, quantity, line_total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          item.productId,
          item.variantId ?? null,
          item.dealId ?? null,
          item.productName,
          item.variantName ?? null,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
          notesPayload
        )
        itemIds.push(Number(itemResult.lastInsertRowid))
      }

      // Insert modifiers (only for normal products; deal children live in notes)
      for (let i = 0; i < parsed.items.length; i++) {
        const item = parsed.items[i]
        const orderItemId = itemIds[i]
        for (const mod of item.modifiers || []) {
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
      if (!parsed.customerName || !parsed.customerPhone || !parsed.customerAddress) {
        throw new AppError('VALIDATION', 'Delivery requires customer name, phone, and address')
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

  // ═══════════════════════════════════════════════════════
  // GET FULL ORDER (with deal_children parsing)
  // ═══════════════════════════════════════════════════════
  static getFullOrder(orderId: number) {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) throw new NotFoundError('Order not found')

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId) as any[]

    const itemsWithModifiers = items.map((item) => {
      let dealChildren: any[] = []
      let cleanNotes = item.notes || ''
      try {
        if (item.notes && typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
          const parsedNotes = JSON.parse(item.notes)
          if (parsedNotes && parsedNotes._type === 'deal_children' && Array.isArray(parsedNotes.children)) {
            dealChildren = parsedNotes.children
            cleanNotes = ''
          }
        }
      } catch {
        // Not JSON — keep notes as-is
      }

      return {
        ...item,
        notes: cleanNotes,
        deal_children: dealChildren,
        modifiers: db.prepare('SELECT * FROM order_item_modifiers WHERE order_item_id = ?').all(item.id)
      }
    })

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId)

    return { order, items: itemsWithModifiers, payment }
  }

  // ═══════════════════════════════════════════════════════
  // LIST ORDERS (basic — Phase 7)
  // ═══════════════════════════════════════════════════════
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
    sql += ' ORDER BY invoice_number DESC LIMIT ? OFFSET ?'
    const mainParams = [...params, parsed.limit, parsed.offset]

    const rows = db.prepare(sql).all(...mainParams) as any[]

    let countSql = 'SELECT COUNT(*) as c FROM orders'
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ')
    const countRow = db.prepare(countSql).get(...params) as { c: number }

    return { orders: rows, total: countRow.c }
  }

  // ═══════════════════════════════════════════════════════
  // LIST ORDERS EXTENDED (Phase 9 — history with filters + stats)
  // ═══════════════════════════════════════════════════════
  static listOrdersExtended(filters: unknown) {
    const db = getDatabase()
    const f: any = filters || {}

    const conditions: string[] = []
    const params: any[] = []

    // Status filter
    if (f.status === 'voided') {
      conditions.push("status = 'voided'")
    } else if (!f.includeVoided) {
      conditions.push("status != 'voided'")
    }

    // Date range
    const range = this.resolveRange(f)
    if (range.from) {
      conditions.push('created_at >= ?')
      params.push(range.from)
    }
    if (range.to) {
      conditions.push('created_at <= ?')
      params.push(range.to)
    }

    if (f.orderType) {
      conditions.push('order_type = ?')
      params.push(f.orderType)
    }
    if (f.paymentMethod) {
      conditions.push('payment_method = ?')
      params.push(f.paymentMethod)
    }
    if (f.search) {
      conditions.push('(order_number LIKE ? OR invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)')
      const s = `%${f.search}%`
      params.push(s, s, s, s)
    }

    const whereSql = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''

    // ⭐ STATS — computed BEFORE pagination, over ALL matching orders
    const statsSql = `
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(AVG(total), 0) as avg_order
      FROM orders${whereSql}
    `
    const stats = db.prepare(statsSql).get(...params) as {
      count: number
      revenue: number
      avg_order: number
    }

    // Paginated rows — sorted by invoice_number DESC (latest first)
    const limit = Number(f.limit) || 50
    const offset = Number(f.offset) || 0
    const rowsSql = `SELECT * FROM orders${whereSql} ORDER BY invoice_number DESC LIMIT ? OFFSET ?`
    const rows = db.prepare(rowsSql).all(...params, limit, offset) as any[]

    // Count (total matching rows)
    const countSql = `SELECT COUNT(*) as c FROM orders${whereSql}`
    const countRow = db.prepare(countSql).get(...params) as { c: number }

    return {
      orders: rows,
      total: countRow.c,
      limit,
      offset,
      stats: {
        count: stats.count || 0,
        revenue: stats.revenue || 0,
        avg_order: stats.avg_order || 0
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // RESOLVE DATE RANGE
  // ═══════════════════════════════════════════════════════
  private static resolveRange(f: any): { from: string | null; to: string | null } {
    if (f.range === 'all') return { from: null, to: null }
    if (f.range === 'custom') {
      return { from: f.dateFrom || null, to: f.dateTo || null }
    }

    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (f.range) {
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

    return { from: start.toISOString(), to: end.toISOString() }
  }

  // ═══════════════════════════════════════════════════════
  // VOID ORDER
  // ═══════════════════════════════════════════════════════
  static voidOrderExtended(data: unknown, userId?: number) {
    const d = data as { orderId: number; reason: string }
    const db = getDatabase()

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(d.orderId) as any
    if (!order) throw new NotFoundError('Order not found')
    if (order.status === 'voided') throw new AppError('ALREADY_VOIDED', 'Order is already voided')
    if (!d.reason || d.reason.trim().length < 3) {
      throw new AppError('REASON_REQUIRED', 'Void reason is required (min 3 chars)')
    }

    db.prepare("UPDATE orders SET status = 'voided' WHERE id = ?").run(d.orderId)

    AuditService.log('order.voided', {
      orderId: d.orderId,
      orderNumber: order.order_number,
      reason: d.reason,
      total: order.total
    }, userId)

    return this.getFullOrder(d.orderId)
  }

  // ═══════════════════════════════════════════════════════
  // RESTORE VOIDED ORDER
  // ═══════════════════════════════════════════════════════
  static restoreOrder(orderId: number, userId?: number) {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) throw new NotFoundError('Order not found')
    if (order.status !== 'voided') throw new AppError('NOT_VOIDED', 'Order is not voided')

    db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(orderId)
    AuditService.log('order.restored', { orderId, orderNumber: order.order_number }, userId)
    return this.getFullOrder(orderId)
  }

  // ═══════════════════════════════════════════════════════
  // PREVIEW NEXT NUMBERS
  // ═══════════════════════════════════════════════════════
  static previewNextNumbers() {
    const db = getDatabase()
    const now = new Date()
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const orderPrefix = SettingsService.get('order.order_prefix') ?? 'ORD'
    const invoicePrefix = SettingsService.get('order.invoice_prefix') ?? 'INV'

    const orderRow = db.prepare('SELECT last_number FROM order_counter WHERE prefix = ? AND date_key = ?')
      .get(orderPrefix, dateKey) as { last_number: number } | undefined

    // Invoice counter uses composite key "INV-YYYYMMDD"
    const invoiceCompositeKey = `${invoicePrefix}-${dateKey}`
    const invoiceRow = db.prepare('SELECT last_number FROM invoice_counter WHERE prefix = ?')
      .get(invoiceCompositeKey) as { last_number: number } | undefined

    return {
      orderNumber: `${orderPrefix}-${dateKey}-${String((orderRow?.last_number ?? 0) + 1).padStart(4, '0')}`,
      invoiceNumber: `${invoicePrefix}-${dateKey}${String((invoiceRow?.last_number ?? 0) + 1).padStart(4, '0')}`
    }
  }
}
