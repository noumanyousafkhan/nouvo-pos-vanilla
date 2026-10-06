import { getDatabase } from '../database/Database'
import { VariantSchema } from './schemas'

export class VariantService {
  static listByProduct(productId: number) {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY id'
    ).all(productId)
  }

  static create(data: unknown) {
    const parsed = VariantSchema.parse(data)
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO product_variants (product_id, name, price_adjust, is_default)
      VALUES (?, ?, ?, ?)
    `).run(parsed.product_id, parsed.name, parsed.price_adjust, parsed.is_default ? 1 : 0)
    return db.prepare('SELECT * FROM product_variants WHERE id = ?').get(result.lastInsertRowid)
  }

  static delete(id: number) {
    const db = getDatabase()
    db.prepare('DELETE FROM product_variants WHERE id = ?').run(id)
  }
}
