import { getDatabase } from '../database/Database'
import { SettingsService } from '../settings/SettingsService'
import {
  ReportFiltersSchema,
  TopProductsFiltersSchema,
  RecentTransactionsFiltersSchema
} from './schemas'

interface RangeDates {
  from: string | null
  to: string | null
}

export class ReportService {
  // ═══════════════════════════════════════════════════════
  // RANGE RESOLVER
  // ═══════════════════════════════════════════════════════
  private static resolveRange(parsed: any): RangeDates {
    if (parsed.range === 'all') return { from: null, to: null }
    if (parsed.range === 'custom') {
      return {
        from: parsed.dateFrom ?? null,
        to: parsed.dateTo ?? null
      }
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
      default:
        return { from: null, to: null }
    }

    return { from: start.toISOString(), to: end.toISOString() }
  }

  private static buildWhere(parsed: any, range: RangeDates, alias = ''): { sql: string; params: any[] } {
    const prefix = alias ? `${alias}.` : ''
    const conditions: string[] = []
    const params: any[] = []

    if (range.from) {
      conditions.push(`${prefix}created_at >= ?`)
      params.push(range.from)
    }
    if (range.to) {
      conditions.push(`${prefix}created_at <= ?`)
      params.push(range.to)
    }

    if (parsed.orderType) {
      conditions.push(`${prefix}order_type = ?`)
      params.push(parsed.orderType)
    }
    if (parsed.paymentMethod) {
      conditions.push(`${prefix}payment_method = ?`)
      params.push(parsed.paymentMethod)
    }

    // By default exclude voided orders unless explicitly included
    if (!parsed.includeVoided) {
      conditions.push(`${prefix}status != 'voided'`)
    }

    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      params
    }
  }

  private static getPreviousPeriodStats(parsed: any, range: RangeDates) {
    const db = getDatabase()
    if (!range.from || !range.to) return { revenue: 0, order_count: 0 }

    const from = new Date(range.from)
    const to = new Date(range.to)
    const duration = to.getTime() - from.getTime()

    const prevFrom = new Date(from.getTime() - duration).toISOString()
    const prevTo = from.toISOString()

    const row = db.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND created_at <= ? AND status != 'voided'
    `).get(prevFrom, prevTo) as any

    return { revenue: row?.revenue || 0, order_count: row?.order_count || 0 }
  }

  // ═══════════════════════════════════════════════════════
  // KPIs
  // ═══════════════════════════════════════════════════════
  static getKpis(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const row = db.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(AVG(total), 0) as avg_order,
        COALESCE(SUM(CASE WHEN order_type = 'dine_in' THEN 1 ELSE 0 END), 0) as dine_in_count,
        COALESCE(SUM(CASE WHEN order_type = 'takeaway' THEN 1 ELSE 0 END), 0) as takeaway_count,
        COALESCE(SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END), 0) as delivery_count
      FROM orders${where.sql}
    `).get(...where.params) as any

    const previous = this.getPreviousPeriodStats(parsed, range)

    const revenueTrend = previous.revenue > 0
      ? ((row.revenue - previous.revenue) / previous.revenue) * 100
      : 0
    const orderTrend = previous.order_count > 0
      ? ((row.order_count - previous.order_count) / previous.order_count) * 100
      : 0

    const target = SettingsService.getNumber('reports.performance_target', 100)
    let performance = 'Good'
    if (row.order_count === 0) performance = 'No Data'
    else if (row.order_count >= target) performance = 'Excellent'
    else if (row.order_count >= target * 0.7) performance = 'Good'
    else performance = 'Low'

    return {
      revenue: Math.round(row.revenue * 100) / 100,
      revenueTrend: Math.round(revenueTrend * 10) / 10,
      orderCount: row.order_count,
      orderTrend: Math.round(orderTrend * 10) / 10,
      avgOrder: Math.round(row.avg_order * 100) / 100,
      performance,
      dineInCount: row.dine_in_count,
      takeawayCount: row.takeaway_count,
      deliveryCount: row.delivery_count
    }
  }

  // ═══════════════════════════════════════════════════════
  // SALES CHART
  // ═══════════════════════════════════════════════════════
  static getSalesChart(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const db = getDatabase()

    let groupExpr: string
    let format: string

    if (parsed.range === 'today') {
      groupExpr = "strftime('%H', o.created_at)"
      format = 'hour'
    } else if (parsed.range === 'week' || parsed.range === 'month') {
      groupExpr = "strftime('%Y-%m-%d', o.created_at)"
      format = 'day'
    } else if (parsed.range === 'all') {
      // 'all' → daily buckets (best for up to ~90 days of data)
      groupExpr = "strftime('%Y-%m-%d', o.created_at)"
      format = 'day'
    } else if (parsed.range === 'year') {
      groupExpr = "strftime('%Y-%m', o.created_at)"
      format = 'month'
    } else {
      groupExpr = "strftime('%Y-%m', o.created_at)"
      format = 'month'
    }

    const where = this.buildWhere(parsed, range, 'o')

    // Total buckets
    const rows = db.prepare(`
      SELECT
        ${groupExpr} as bucket,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM orders o${where.sql}
      GROUP BY bucket
      ORDER BY bucket ASC
    `).all(...where.params) as any[]

    // Per-category series
    const categoryRows = db.prepare(`
      SELECT
        ${groupExpr} as bucket,
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(oi.line_total), 0) as category_revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${where.sql}
      GROUP BY bucket, c.id
      ORDER BY bucket ASC
    `).all(...where.params) as any[]

    // Top 3 categories
    const catTotals: Record<number, { id: number; name: string; total: number }> = {}
    for (const r of categoryRows) {
      if (!r.category_id) continue
      if (!catTotals[r.category_id]) {
        catTotals[r.category_id] = { id: r.category_id, name: r.category_name || 'Other', total: 0 }
      }
      catTotals[r.category_id].total += r.category_revenue
    }
    const topCategories = Object.values(catTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    const series: Record<string, number[]> = {}
    for (const cat of topCategories) {
      series[cat.name] = rows.map((b) => {
        const row = categoryRows.find(
          (r) => r.bucket === b.bucket && r.category_id === cat.id
        )
        return row ? row.category_revenue : 0
      })
    }

    return {
      format,
      buckets: rows.map((r) => ({ label: r.bucket, revenue: r.revenue, orders: r.order_count })),
      categories: topCategories.map((c) => ({ id: c.id, name: c.name })),
      series
    }
  }

  // ═══════════════════════════════════════════════════════
  // TOP PRODUCTS (with deal children expansion)
  // ═══════════════════════════════════════════════════════
  static getTopProducts(filters: unknown) {
    const parsed = TopProductsFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        oi.product_id,
        oi.product_name,
        oi.quantity,
        oi.line_total,
        oi.notes,
        oi.order_id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${where.sql}
    `).all(...where.params) as any[]

    const map: Record<string, {
      product_id: number | null
      product_name: string
      total_qty: number
      total_revenue: number
      order_ids: Set<number>
    }> = {}

    for (const row of rows) {
      let children: any[] = []
      try {
        if (row.notes && typeof row.notes === 'string' && row.notes.trim().startsWith('{')) {
          const parsedNotes = JSON.parse(row.notes)
          if (parsedNotes && parsedNotes._type === 'deal_children' && Array.isArray(parsedNotes.children)) {
            children = parsedNotes.children
          }
        }
      } catch {}

      if (children.length > 0) {
        const totalChildQty = children.reduce((s: number, c: any) => s + (Number(c.quantity) || 0), 0)
        const dealLineTotal = Number(row.line_total) || 0

        for (const child of children) {
          const name = child.variantName
            ? `${child.productName} (${child.variantName})`
            : child.productName
          const qty = Number(child.quantity) || 0
          const childRevenue = totalChildQty > 0 ? (dealLineTotal * qty) / totalChildQty : 0

          if (!map[name]) {
            map[name] = {
              product_id: child.productId ?? null,
              product_name: name,
              total_qty: 0,
              total_revenue: 0,
              order_ids: new Set()
            }
          }
          map[name].total_qty += qty
          map[name].total_revenue += childRevenue
          map[name].order_ids.add(row.order_id)
        }
      } else {
        const name = row.product_name
        if (!map[name]) {
          map[name] = {
            product_id: row.product_id,
            product_name: name,
            total_qty: 0,
            total_revenue: 0,
            order_ids: new Set()
          }
        }
        map[name].total_qty += Number(row.quantity) || 0
        map[name].total_revenue += Number(row.line_total) || 0
        map[name].order_ids.add(row.order_id)
      }
    }

    return Object.values(map)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, parsed.limit)
      .map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        total_qty: r.total_qty,
        total_revenue: Math.round(r.total_revenue * 100) / 100,
        order_count: r.order_ids.size
      }))
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY PERFORMANCE
  // ═══════════════════════════════════════════════════════
  static getCategoryPerformance(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as qty,
        COALESCE(SUM(oi.line_total), 0) as revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${where.sql}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + (r.revenue || 0), 0)

    return rows.map((r) => ({
      category_id: r.category_id,
      category_name: r.category_name || 'Uncategorized',
      qty: r.qty,
      revenue: Math.round(r.revenue * 100) / 100,
      percentage: total > 0 ? (r.revenue / total) * 100 : 0
    }))
  }

  // ═══════════════════════════════════════════════════════
  // PAYMENT BREAKDOWN
  // ═══════════════════════════════════════════════════════
  static getPaymentBreakdown(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders${where.sql}
      GROUP BY payment_method
      ORDER BY revenue DESC
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + (r.revenue || 0), 0)

    return rows.map((r) => ({
      payment_method: r.payment_method,
      count: r.count,
      revenue: Math.round(r.revenue * 100) / 100,
      percentage: total > 0 ? (r.revenue / total) * 100 : 0
    }))
  }

  // ═══════════════════════════════════════════════════════
  // ORDER TYPE ANALYSIS
  // ═══════════════════════════════════════════════════════
  static getOrderTypeAnalysis(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        order_type,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders${where.sql}
      GROUP BY order_type
      ORDER BY revenue DESC
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + (r.count || 0), 0)

    return rows.map((r) => ({
      order_type: r.order_type,
      count: r.count,
      revenue: Math.round(r.revenue * 100) / 100,
      percentage: total > 0 ? (r.count / total) * 100 : 0
    }))
  }

  // ═══════════════════════════════════════════════════════
  // ITEMS PERFORMANCE (with deal children expansion)
  // ═══════════════════════════════════════════════════════
  static getItemsPerformance(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        oi.product_name,
        oi.quantity,
        oi.notes
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${where.sql}
    `).all(...where.params) as any[]

    const totals: Record<string, number> = {}

    for (const row of rows) {
      let children: any[] = []
      try {
        if (row.notes && typeof row.notes === 'string' && row.notes.trim().startsWith('{')) {
          const parsedNotes = JSON.parse(row.notes)
          if (parsedNotes && parsedNotes._type === 'deal_children' && Array.isArray(parsedNotes.children)) {
            children = parsedNotes.children
          }
        }
      } catch {}

      if (children.length > 0) {
        for (const child of children) {
          const name = child.variantName
            ? `${child.productName} (${child.variantName})`
            : child.productName
          const qty = Number(child.quantity) || 0
          totals[name] = (totals[name] || 0) + qty
        }
      } else {
        const name = row.product_name
        const qty = Number(row.quantity) || 0
        totals[name] = (totals[name] || 0) + qty
      }
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)

    return sorted.map(([label, value]) => ({ label, value }))
  }

  // ═══════════════════════════════════════════════════════
  // RECENT TRANSACTIONS
  // ═══════════════════════════════════════════════════════
  static getRecentTransactions(filters: unknown) {
    const parsed = RecentTransactionsFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range)
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        id, order_number, invoice_number, order_type,
        customer_name, customer_phone, total, payment_method,
        status, created_at
      FROM orders${where.sql}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...where.params, parsed.limit) as any[]

    for (const row of rows) {
      const items = db.prepare(`
        SELECT product_name FROM order_items WHERE order_id = ?
      `).all(row.id) as any[]
      row.items_summary = items.map((i) => i.product_name).join(', ')
    }

    return rows
  }

  // ═══════════════════════════════════════════════════════
  // SCORE — FIXED (was causing SQLITE_ERROR near "AND")
  // ═══════════════════════════════════════════════════════
  static getScore(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const db = getDatabase()

    // Total orders (including voided)
    const totalWhere = this.buildWhere({ ...parsed, includeVoided: true }, range)
    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM orders${totalWhere.sql}
    `).get(...totalWhere.params) as any

    const totalOrders = totalRow?.count || 0

    // Voided orders — build SQL safely (WHERE + AND)
    const voidedWhere = this.buildWhere({ ...parsed, includeVoided: true }, range)
    const voidedSql = voidedWhere.sql
      ? `${voidedWhere.sql} AND status = 'voided'`
      : ` WHERE status = 'voided'`
    const voidedRow = db.prepare(`
      SELECT COUNT(*) as count FROM orders${voidedSql}
    `).get(...voidedWhere.params) as any

    const voidedOrders = voidedRow?.count || 0

    // Score calculation
    let score = 100
    if (totalOrders > 0) {
      const voidRatio = voidedOrders / totalOrders
      score = Math.max(0, Math.round(100 - voidRatio * 100))
    } else {
      score = 100
    }

    const successRate = totalOrders > 0
      ? Math.round(((totalOrders - voidedOrders) / totalOrders) * 100)
      : 100

    return {
      score,
      totalOrders,
      voidedOrders,
      complaints: [
        { label: 'Voided Orders', value: voidedOrders },
        { label: 'Success Rate', value: `${successRate}%` }
      ]
    }
  }

  // ═══════════════════════════════════════════════════════
  // FULL DASHBOARD
  // ═══════════════════════════════════════════════════════
  static getFullDashboard(filters: unknown) {
    return {
      kpis: this.getKpis(filters),
      salesChart: this.getSalesChart(filters),
      topProducts: this.getTopProducts(filters),
      categoryPerformance: this.getCategoryPerformance(filters),
      paymentBreakdown: this.getPaymentBreakdown(filters),
      orderTypeAnalysis: this.getOrderTypeAnalysis(filters),
      itemsPerformance: this.getItemsPerformance(filters),
      recentTransactions: this.getRecentTransactions(filters),
      score: this.getScore(filters)
    }
  }
}
