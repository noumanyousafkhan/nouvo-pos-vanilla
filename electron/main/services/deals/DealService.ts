import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { AppError, NotFoundError } from '../utils/errors'
import { FullDealSchema } from './schemas'

export interface Deal {
  id: number
  name: string
  price: number
  image_path: string | null
  is_active: number
  valid_from: string | null
  valid_to: string | null
  created_at: string
}

export interface DealItem {
  id: number
  deal_id: number
  product_id: number
  variant_id: number | null
  quantity: number
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
  // ═══════════════════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════════════════
  static list(includeInactive = false, onlyValid = true): Deal[] {
    const db = getDatabase()
    let sql = `
      SELECT d.*,
        (SELECT COUNT(*) FROM deal_items WHERE deal_id = d.id) as items_count,
        (SELECT COALESCE(SUM(quantity), 0) FROM deal_items WHERE deal_id = d.id) as total_quantity
      FROM deals d
    `
    const conditions: string[] = []
    const params: any[] = []

    if (!includeInactive) conditions.push('d.is_active = 1')

    if (onlyValid) {
      const now = new Date().toISOString()
      conditions.push('(d.valid_from IS NULL OR d.valid_from <= ?)')
      conditions.push('(d.valid_to IS NULL OR d.valid_to >= ?)')
      params.push(now, now)
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY d.name'

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

  // ═══════════════════════════════════════════════════════
  // CALCULATE NORMAL TOTAL (used for allocation only)
  // ═══════════════════════════════════════════════════════
  static calculateNormalTotal(
    items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>
  ): number {
    const db = getDatabase()
    let total = 0

    for (const item of items) {
      const product = db.prepare(
        'SELECT id, price FROM products WHERE id = ? AND is_deleted = 0'
      ).get(item.product_id) as { id: number; price: number } | undefined

      if (!product) {
        throw new AppError('PRODUCT_NOT_FOUND', `Product ${item.product_id} not found`)
      }

      let unitPrice = Number(product.price) || 0

      if (item.variant_id) {
        const variant = db.prepare(
          'SELECT price_adjust FROM product_variants WHERE id = ?'
        ).get(item.variant_id) as { price_adjust: number } | undefined
        if (variant) {
          unitPrice += Number(variant.price_adjust) || 0
        }
      }

      total += unitPrice * (Number(item.quantity) || 1)
    }

    return Math.round(total * 100) / 100
  }

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════
  static create(data: unknown, userId?: number): Deal {
    const parsed = FullDealSchema.parse(data)
    const db = getDatabase()

    const tx = db.transaction(() => {
      const dealResult = db.prepare(`
        INSERT INTO deals (name, price, image_path, is_active, valid_from, valid_to)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        parsed.name,
        parsed.price,
        parsed.image_path || null,
        parsed.is_active ? 1 : 0,
        parsed.valid_from || null,
        parsed.valid_to || null
      )

      const dealId = Number(dealResult.lastInsertRowid)

      for (const item of parsed.items) {
        db.prepare(
          'INSERT INTO deal_items (deal_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(dealId, item.product_id, item.variant_id ?? null, item.quantity)
      }

      return dealId
    })

    const dealId = tx()

    AuditService.log('deal.created', {
      dealId,
      name: parsed.name,
      price: parsed.price
    }, userId)

    return this.get(dealId)
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════
  static update(id: number, data: unknown, userId?: number): Deal {
    const parsed = FullDealSchema.parse(data)
    const db = getDatabase()

    const existing = this.get(id)

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE deals
        SET name = ?, price = ?, image_path = ?, is_active = ?, valid_from = ?, valid_to = ?
        WHERE id = ?
      `).run(
        parsed.name,
        parsed.price,
        parsed.image_path || null,
        parsed.is_active ? 1 : 0,
        parsed.valid_from || null,
        parsed.valid_to || null,
        id
      )

      db.prepare('DELETE FROM deal_items WHERE deal_id = ?').run(id)

      for (const item of parsed.items) {
        db.prepare(
          'INSERT INTO deal_items (deal_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(id, item.product_id, item.variant_id ?? null, item.quantity)
      }
    })

    tx()

    AuditService.log('deal.updated', {
      dealId: id,
      name: parsed.name,
      oldName: existing.name,
      price: parsed.price
    }, userId)

    return this.get(id)
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE FULL (alias for update)
  // ═══════════════════════════════════════════════════════
  static updateFull(id: number, data: unknown, userId?: number): Deal {
    return this.update(id, data, userId)
  }

  // ═══════════════════════════════════════════════════════
  // REPLACE ITEMS (deal ke items replace karo)
  // ═══════════════════════════════════════════════════════
  static replaceItems(
    id: number,
    items: Array<{ product_id: number; variant_id?: number | null; quantity: number }>,
    userId?: number
  ): Deal {
    const db = getDatabase()
    const deal = this.get(id)

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM deal_items WHERE deal_id = ?').run(id)

      for (const item of items) {
        db.prepare(
          'INSERT INTO deal_items (deal_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(id, item.product_id, item.variant_id ?? null, item.quantity)
      }
    })

    tx()

    AuditService.log('deal.items_replaced', {
      dealId: id,
      name: deal.name,
      itemCount: items.length
    }, userId)

    return this.get(id)
  }

  // ═══════════════════════════════════════════════════════
  // TOGGLE ACTIVE (is_active flip karo)
  // ═══════════════════════════════════════════════════════
  static toggleActive(id: number, userId?: number): Deal {
    const db = getDatabase()
    const deal = this.get(id)
    const newActive = deal.is_active ? 0 : 1

    db.prepare('UPDATE deals SET is_active = ? WHERE id = ?').run(newActive, id)

    AuditService.log('deal.toggled', {
      dealId: id,
      name: deal.name,
      isActive: newActive === 1
    }, userId)

    return this.get(id)
  }

  // ═══════════════════════════════════════════════════════
  // TOGGLE (alias for toggleActive — backward compat)
  // ═══════════════════════════════════════════════════════
  static toggle(id: number, userId?: number): Deal {
    return this.toggleActive(id, userId)
  }

  // ═══════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════
  static delete(id: number, userId?: number): void {
    const db = getDatabase()
    const deal = this.get(id)

    db.prepare('DELETE FROM deals WHERE id = ?').run(id)

    AuditService.log('deal.deleted', {
      dealId: id,
      name: deal.name
    }, userId)
  }

  // ═══════════════════════════════════════════════════════
  // EXPAND TO CART
  // ═══════════════════════════════════════════════════════
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
        allocatedLineTotal: i === expanded.length - 1 ? deal.price - equal * (expanded.length - 1) : equal
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
