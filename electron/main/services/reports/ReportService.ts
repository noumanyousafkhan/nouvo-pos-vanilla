import { getDatabase } from '../database/Database'
import { ReportFiltersSchema, TopProductsFiltersSchema, RecentTransactionsFiltersSchema } from './schemas'
import { SettingsService } from '../settings/SettingsService'

interface RangeDates {
  from: string | null
  to: string | null
}

export class ReportService {
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
    }

    return { from: start.toISOString(), to: end.toISOString() }
  }

  /**
   * Build WHERE clause. Optional `alias` prefixes column names
   * to avoid ambiguity when JOINs are involved.
   */
  private static buildWhere(
    parsed: any,
    range: RangeDates,
    alias: string = ''
  ): { sql: string; params: any[] } {
    const conditions: string[] = []
    const params: any[] = []
    const p = alias ? `${alias}.` : ''

    if (!parsed.includeVoided) {
      conditions.push(`${p}status != 'voided'`)
    }
    if (range.from) {
      conditions.push(`${p}created_at >= ?`)
      params.push(range.from)
    }
    if (range.to) {
      conditions.push(`${p}created_at <= ?`)
      params.push(range.to)
    }
    if (parsed.orderType) {
      conditions.push(`${p}order_type = ?`)
      params.push(parsed.orderType)
    }
    if (parsed.paymentMethod) {
      conditions.push(`${p}payment_method = ?`)
      params.push(parsed.paymentMethod)
    }

    const sql = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''
    return { sql, params }
  }

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
    else if (row.order_count >= target * 0.5) performance = 'Good'
    else performance = 'Low'

    return {
      revenue: row.revenue,
      revenueTrend,
      orderCount: row.order_count,
      orderTrend,
      avgOrder: row.avg_order,
      performance,
      dineInCount: row.dine_in_count,
      takeawayCount: row.takeaway_count,
      deliveryCount: row.delivery_count
    }
  }

  private static getPreviousPeriodStats(parsed: any, range: RangeDates) {
    const db = getDatabase()
    if (!range.from || !range.to) {
      return { revenue: 0, order_count: 0 }
    }
    const from = new Date(range.from)
    const to = new Date(range.to)
    const duration = to.getTime() - from.getTime()
    const prevFrom = new Date(from.getTime() - duration).toISOString()
    const prevTo = new Date(to.getTime() - duration).toISOString()

    const where = this.buildWhere(parsed, { from: prevFrom, to: prevTo })
    const row = db.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders${where.sql}
    `).get(...where.params) as any
    return row
  }

  /**
   * Sales chart — pass alias 'o' so joined queries stay unambiguous.
   */
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
    } else {
      groupExpr = "strftime('%Y-%m', o.created_at)"
      format = 'month'
    }

    // Use alias 'o' for orders in both queries
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

  static getTopProducts(filters: unknown) {
    const parsed = TopProductsFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.line_total) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${where.sql}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_qty DESC
      LIMIT ?
    `).all(...where.params, parsed.limit) as any[]

    return rows
  }

  static getCategoryPerformance(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(oi.line_total), 0) as revenue,
        SUM(oi.quantity) as qty,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${where.sql}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + r.revenue, 0)
    return rows.map((r) => ({
      ...r,
      percentage: total > 0 ? (r.revenue / total) * 100 : 0
    }))
  }

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
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + r.revenue, 0)
    return rows.map((r) => ({
      ...r,
      percentage: total > 0 ? (r.revenue / total) * 100 : 0
    }))
  }

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
    `).all(...where.params) as any[]

    const total = rows.reduce((s, r) => s + r.revenue, 0)
    return rows.map((r) => ({
      ...r,
      percentage: total > 0 ? (r.revenue / total) * 100 : 0
    }))
  }

  static getItemsPerformance(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const where = this.buildWhere(parsed, range, 'o')
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT
        oi.product_name,
        SUM(oi.quantity) as qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      ${where.sql}
      GROUP BY oi.product_name
      ORDER BY qty DESC
      LIMIT 7
    `).all(...where.params) as any[]

    return rows.map((r) => ({ label: r.product_name, value: r.qty }))
  }

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

  /**
   * Score card — FIXED: proper where clause for voided count.
   */
  static getScore(filters: unknown) {
    const parsed = ReportFiltersSchema.parse(filters)
    const range = this.resolveRange(parsed)
    const db = getDatabase()

    // Total orders (with voided)
    const whereAll = this.buildWhere({ ...parsed, includeVoided: true }, range)
    const totalRow = db.prepare(`SELECT COUNT(*) as c FROM orders${whereAll.sql}`)
      .get(...whereAll.params) as { c: number }

    // Voided orders — separate where with proper AND
    const whereVoided = this.buildWhere({ ...parsed, includeVoided: true }, range)
    const voidedConditions: string[] = []
    const voidedParams: any[] = []
    if (whereVoided.sql.includes('WHERE')) {
      voidedConditions.push(whereVoided.sql.replace(' WHERE ', ''))
      voidedParams.push(...whereVoided.params)
    }
    voidedConditions.push("status = 'voided'")
    const voidedRow = db.prepare(
      `SELECT COUNT(*) as c FROM orders WHERE ${voidedConditions.join(' AND ')}`
    ).get(...voidedParams) as { c: number }

    const successRate = totalRow.c > 0
      ? ((totalRow.c - voidedRow.c) / totalRow.c) * 100
      : 100

    return {
      score: Math.round(successRate),
      totalOrders: totalRow.c,
      voidedOrders: voidedRow.c,
      complaints: [
        { label: 'Voided Orders', value: voidedRow.c },
        { label: 'Success Rate', value: `${Math.round(successRate)}%` }
      ]
    }
  }

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
