import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { DealSchema, DealUpdateSchema } from './schemas'
import { NotFoundError, AppError } from '../utils/errors'

export interface Deal {
  id: number
  name: string
  price: number
  image_path: string
  is_active: number
  valid_from: string | null
  valid_to: string | null
  created_at: string
}

export interface CartDealLine {
  dealId: number
  dealName: string
  dealPrice: number
  productId: number
  productName: string
  variantId: number | null
  variantName: string | null
  quantity: number
  normalUnitPrice: number
  allocatedUnitPrice: number
  allocatedLineTotal: number
}

export class DealService {
  static list(includeInactive = false, onlyValid = true): Deal[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM deals'
    const conditions: string[] = []
    const params: any[] = []

    if (!includeInactive) conditions.push('is_active = 1')

    if (onlyValid) {
      const now = new Date().toISOString()
      conditions.push('(valid_from IS NULL OR valid_from <= ?)')
      conditions.push('(valid_to IS NULL OR valid_to >= ?)')
      params.push(now, now)
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY name'

    return db.prepare(sql).all(...params) as Deal[]
  }

  static get(id: number): Deal {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM deals WHERE id = ?').get(id) as Deal | undefined
    if (!row) throw new NotFoundError('Deal not found')
    return row
  }

  static getItems(dealId: number) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM deal_items WHERE deal_id = ? ORDER BY id').all(dealId)
  }

  static getFull(id: number) {
    return { deal: this.get(id), items: this.getItems(id) }
  }

  static isDealValid(deal: Deal, at: Date = new Date()): boolean {
    if (!deal.is_active) return false
    const now = at.toISOString()
    if (deal.valid_from && deal.valid_from > now) return false
    if (deal.valid_to && deal.valid_to < now) return false
    return true
  }

  static create(data: unknown, userId?: number) {
    const parsed = DealSchema.parse(data)
    const db = getDatabase()

    for (const item of parsed.items) {
      const product = db.prepare(
        'SELECT id FROM products WHERE id = ? AND is_deleted = 0'
      ).get(item.product_id)
      if (!product) throw new AppError('PRODUCT_NOT_FOUND', `Product ${item.product_id} not found`)
    }

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO deals (name, price, image_path, is_active, valid_from, valid_to)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        parsed.name,
        parsed.price,
        parsed.image_path,
        parsed.is_active ? 1 : 0,
        parsed.valid_from ?? null,
        parsed.valid_to ?? null
      )

      const dealId = Number(result.lastInsertRowid)

      for (const item of parsed.items) {
        db.prepare(`
          INSERT INTO deal_items (deal_id, product_id, variant_id, quantity)
          VALUES (?, ?, ?, ?)
        `).run(dealId, item.product_id, item.variant_id ?? null, item.quantity)
      }

      return dealId
    })

    const dealId = tx()
    AuditService.log('deal.created', { id: dealId, name: parsed.name }, userId)
    return this.getFull(dealId)
  }

  static update(id: number, data: unknown, userId?: number) {
    const parsed = DealUpdateSchema.parse(data)
    const db = getDatabase()

    this.get(id)
    const fields: string[] = []
    const values: any[] = []

    for (const [k, v] of Object.entries(parsed)) {
      fields.push(`${k} = ?`)
      values.push(typeof v === 'boolean' ? (v ? 1 : 0) : v)
    }

    if (fields.length > 0) {
      values.push(id)
      db.prepare(`UPDATE deals SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    AuditService.log('deal.updated', { id, changes: parsed }, userId)
    return this.getFull(id)
  }

  static replaceItems(dealId: number, items: unknown[], userId?: number) {
    const db = getDatabase()
    this.get(dealId)

    const validated = items.map((i) => DealSchema.shape.items.element.parse(i))

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM deal_items WHERE deal_id = ?').run(dealId)
      for (const item of validated) {
        db.prepare(`
          INSERT INTO deal_items (deal_id, product_id, variant_id, quantity)
          VALUES (?, ?, ?, ?)
        `).run(dealId, item.product_id, item.variant_id ?? null, item.quantity)
      }
    })
    tx()

    AuditService.log('deal.items_replaced', { dealId, count: validated.length }, userId)
    return this.getFull(dealId)
  }

  static delete(id: number, userId?: number): void {
    const db = getDatabase()
    const deal = this.get(id)
    db.prepare('DELETE FROM deals WHERE id = ?').run(id)
    AuditService.log('deal.deleted', { id, name: deal.name }, userId)
  }

  static toggleActive(id: number, userId?: number): Deal {
    const db = getDatabase()
    const deal = this.get(id)
    db.prepare('UPDATE deals SET is_active = ? WHERE id = ?').run(
      deal.is_active ? 0 : 1,
      id
    )
    AuditService.log('deal.toggled', { id, active: !deal.is_active }, userId)
    return this.get(id)
  }

  static expandToCart(dealId: number): CartDealLine[] {
    const db = getDatabase()
    const { deal, items } = this.getFull(dealId)

    if (!this.isDealValid(deal)) {
      throw new AppError('DEAL_INVALID', 'Deal is not currently valid')
    }
    if (items.length === 0) {
      throw new AppError('DEAL_EMPTY', 'Deal has no items')
    }

    const expanded = (items as any[]).map((item) => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any
      if (!product) throw new AppError('PRODUCT_NOT_FOUND', `Product ${item.product_id} not found`)

      let variantName: string | null = null
      let normalUnitPrice = product.price

      if (item.variant_id) {
        const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(item.variant_id) as any
        if (variant) {
          variantName = variant.name
          normalUnitPrice = product.price + (variant.price_adjust || 0)
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        image_path: product.image_path,
        variantId: item.variant_id,
        variantName,
        quantity: item.quantity,
        normalUnitPrice,
        normalLineTotal: normalUnitPrice * item.quantity
      }
    })

    const normalTotal = expanded.reduce((sum, e) => sum + e.normalLineTotal, 0)

    if (normalTotal <= 0) {
      const equal = deal.price / expanded.length
      return expanded.map((e, i) => ({
        dealId: deal.id,
        dealName: deal.name,
        dealPrice: deal.price,
        productId: e.productId,
        productName: e.productName,
        variantId: e.variantId,
        variantName: e.variantName,
        quantity: e.quantity,
        normalUnitPrice: e.normalUnitPrice,
        allocatedUnitPrice: equal / e.quantity,
        allocatedLineTotal: i === expanded.length - 1
          ? deal.price - equal * (expanded.length - 1)
          : equal
      }))
    }

    let allocatedSoFar = 0
    return expanded.map((e, i) => {
      const isLast = i === expanded.length - 1
      const ratio = e.normalLineTotal / normalTotal

      let allocatedLineTotal: number
      if (isLast) {
        allocatedLineTotal = Math.round((deal.price - allocatedSoFar) * 100) / 100
      } else {
        allocatedLineTotal = Math.round(deal.price * ratio * 100) / 100
        allocatedSoFar += allocatedLineTotal
      }

      return {
        dealId: deal.id,
        dealName: deal.name,
        dealPrice: deal.price,
        productId: e.productId,
        productName: e.productName,
        variantId: e.variantId,
        variantName: e.variantName,
        quantity: e.quantity,
        normalUnitPrice: e.normalUnitPrice,
        allocatedUnitPrice: Math.round((allocatedLineTotal / e.quantity) * 100) / 100,
        allocatedLineTotal
      }
    })
  }
}
