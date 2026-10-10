import { getDatabase } from '../database/Database'
import { AuditService } from '../audit/AuditService'
import { CategorySchema, CategoryUpdateSchema } from './schemas'
import { NotFoundError, AppError } from '../utils/errors'

export interface Category {
  id: number
  name: string
  sort_order: number
  is_active: number
  image_path: string
  created_at: string
  product_count?: number
}

export class CategoryService {
  static list(includeInactive = false): Category[] {
    const db = getDatabase()
    const whereClause = includeInactive ? '' : 'WHERE c.is_active = 1'
    
    const sql = `
      SELECT
        c.*,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_deleted = 0
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `
    return db.prepare(sql).all() as Category[]
  }

  static get(id: number): Category {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
    if (!row) throw new NotFoundError('Category not found')
    return row
  }

  static create(data: unknown, userId?: number): Category {
    const parsed = CategorySchema.parse(data)
    const db = getDatabase()

    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(parsed.name)
    if (existing) throw new AppError('DUPLICATE', 'Category name already exists')

    const result = db.prepare(`
      INSERT INTO categories (name, sort_order, is_active, image_path)
      VALUES (?, ?, ?, ?)
    `).run(
      parsed.name,
      parsed.sort_order,
      parsed.is_active ? 1 : 0,
      parsed.image_path
    )

    const created = this.get(Number(result.lastInsertRowid))
    AuditService.log('menu.category.created', { id: created.id, name: created.name }, userId)
    return created
  }

  static update(id: number, data: unknown, userId?: number): Category {
    const parsed = CategoryUpdateSchema.parse(data)
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
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    const updated = this.get(id)
    AuditService.log('menu.category.updated', { id, changes: parsed }, userId)
    return updated
  }

  static delete(id: number, userId?: number): void {
    const db = getDatabase()
    const category = this.get(id)

    const products = db.prepare(
      'SELECT COUNT(*) as c FROM products WHERE category_id = ? AND is_deleted = 0'
    ).get(id) as { c: number }

    if (products.c > 0) {
      throw new AppError('CATEGORY_HAS_PRODUCTS', 'Cannot delete category with products. Deactivate instead.')
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    AuditService.log('menu.category.deleted', { id, name: category.name }, userId)
  }

  static toggleActive(id: number, userId?: number): Category {
    const db = getDatabase()
    const category = this.get(id)
    db.prepare('UPDATE categories SET is_active = ? WHERE id = ?').run(
      category.is_active ? 0 : 1,
      id
    )
    AuditService.log('menu.category.toggled', { id, active: !category.is_active }, userId)
    return this.get(id)
  }

  static reorder(orderedIds: number[], userId?: number): void {
    const db = getDatabase()
    const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?')
    const tx = db.transaction(() => {
      orderedIds.forEach((id, index) => update.run(index, id))
    })
    tx()
    AuditService.log('menu.category.reordered', { orderedIds }, userId)
  }
}
