import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { ProductSchema, ProductUpdateSchema, FullProductSchema } from './schemas'
import { NotFoundError } from '../utils/errors'

export interface Product {
  id: number
  category_id: number
  name: string
  price: number
  image_path: string
  is_active: number
  has_variants: number
  has_modifiers: number
  is_deleted: number
  created_at: string
}

export class ProductService {
  static list(categoryId?: number | null, includeInactive = false): Product[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM products WHERE is_deleted = 0'
    const params: any[] = []

    if (categoryId) {
      sql += ' AND category_id = ?'
      params.push(categoryId)
    }
    if (!includeInactive) {
      sql += ' AND is_active = 1'
    }
    sql += ' ORDER BY name'

    return db.prepare(sql).all(...params) as Product[]
  }

  static get(id: number): Product {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_deleted = 0').get(id) as Product | undefined
    if (!row) throw new NotFoundError('Product not found')
    return row
  }

  static create(data: unknown, userId?: number): Product {
    const parsed = ProductSchema.parse(data)
    const db = getDatabase()

    const result = db.prepare(`
      INSERT INTO products (category_id, name, price, image_path, is_active, has_variants, has_modifiers)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      parsed.category_id,
      parsed.name,
      parsed.price,
      parsed.image_path,
      parsed.is_active ? 1 : 0,
      parsed.has_variants ? 1 : 0,
      parsed.has_modifiers ? 1 : 0
    )

    const created = this.get(Number(result.lastInsertRowid))
    AuditService.log('menu.product.created', { id: created.id, name: created.name }, userId)
    return created
  }

  static update(id: number, data: unknown, userId?: number): Product {
    const parsed = ProductUpdateSchema.parse(data)
    const db = getDatabase()

    this.get(id)
    const fields: string[] = []
    const values: any[] = []

    for (const [k, v] of Object.entries(parsed)) {
      fields.push(`${k} = ?`)
      values.push(typeof v === 'boolean' ? (v ? 1 : 0) : v)
    }

    if (fields.length === 0) return this.get(id)

    values.push(id)
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    const updated = this.get(id)
    AuditService.log('menu.product.updated', { id, changes: parsed }, userId)
    return updated
  }

  static softDelete(id: number, userId?: number): void {
    const db = getDatabase()
    const product = this.get(id)
    db.prepare('UPDATE products SET is_deleted = 1, is_active = 0 WHERE id = ?').run(id)
    AuditService.log('menu.product.deleted', { id, name: product.name }, userId)
  }

  static toggleActive(id: number, userId?: number): Product {
    const db = getDatabase()
    const product = this.get(id)
    db.prepare('UPDATE products SET is_active = ? WHERE id = ?').run(
      product.is_active ? 0 : 1,
      id
    )
    AuditService.log('menu.product.toggled', { id, active: !product.is_active }, userId)
    return this.get(id)
  }

  static getFull(id: number) {
    const db = getDatabase()
    const product = this.get(id)

    const variants = db.prepare(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY id'
    ).all(id)

    const modifiers = db.prepare(
      'SELECT * FROM product_modifiers WHERE product_id = ? ORDER BY id'
    ).all(id) as any[]

    const modifiersWithOptions = modifiers.map((m) => ({
      ...m,
      options: db.prepare(
        'SELECT * FROM modifier_options WHERE modifier_id = ? ORDER BY id'
      ).all(m.id)
    }))

    return { product, variants, modifiers: modifiersWithOptions }
  }

  static upsertFull(data: unknown, userId?: number) {
    const parsed = FullProductSchema.parse(data)
    const db = getDatabase()

    const tx = db.transaction(() => {
      let productId: number

      const existing = db.prepare(
        'SELECT id FROM products WHERE name = ? AND category_id = ? AND is_deleted = 0'
      ).get(parsed.product.name, parsed.product.category_id) as { id: number } | undefined

      if (existing) {
        productId = existing.id
        this.update(productId, {
          ...parsed.product,
          has_variants: parsed.variants.length > 0,
          has_modifiers: parsed.modifiers.length > 0
        }, userId)
      } else {
        const created = this.create({
          ...parsed.product,
          has_variants: parsed.variants.length > 0,
          has_modifiers: parsed.modifiers.length > 0
        }, userId)
        productId = created.id
      }

      // Replace variants
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId)
      for (const v of parsed.variants) {
        db.prepare(`
          INSERT INTO product_variants (product_id, name, price_adjust, is_default)
          VALUES (?, ?, ?, ?)
        `).run(productId, v.name, v.price_adjust, v.is_default ? 1 : 0)
      }

      // Replace modifiers
      db.prepare('DELETE FROM product_modifiers WHERE product_id = ?').run(productId)
      for (const m of parsed.modifiers) {
        const modResult = db.prepare(`
          INSERT INTO product_modifiers (product_id, name, is_required, is_multiple)
          VALUES (?, ?, ?, ?)
        `).run(productId, m.name, m.is_required ? 1 : 0, m.is_multiple ? 1 : 0)

        const modifierId = Number(modResult.lastInsertRowid)
        for (const o of m.options) {
          db.prepare(`
            INSERT INTO modifier_options (modifier_id, name, price, is_default)
            VALUES (?, ?, ?, ?)
          `).run(modifierId, o.name, o.price, o.is_default ? 1 : 0)
        }
      }

      return productId
    })

    const productId = tx()
    return this.getFull(productId)
  }
}
