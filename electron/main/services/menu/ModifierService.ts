import { getDatabase } from '../database/Database'
import { ModifierSchema, ModifierOptionSchema } from './schemas'

export class ModifierService {
  static listByProduct(productId: number) {
    const db = getDatabase()
    const modifiers = db.prepare(
      'SELECT * FROM product_modifiers WHERE product_id = ? ORDER BY id'
    ).all(productId) as any[]

    return modifiers.map((m) => ({
      ...m,
      options: db.prepare(
        'SELECT * FROM modifier_options WHERE modifier_id = ? ORDER BY id'
      ).all(m.id)
    }))
  }

  static createModifier(data: unknown) {
    const parsed = ModifierSchema.parse(data)
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO product_modifiers (product_id, name, is_required, is_multiple)
      VALUES (?, ?, ?, ?)
    `).run(parsed.product_id, parsed.name, parsed.is_required ? 1 : 0, parsed.is_multiple ? 1 : 0)
    return db.prepare('SELECT * FROM product_modifiers WHERE id = ?').get(result.lastInsertRowid)
  }

  static deleteModifier(id: number) {
    const db = getDatabase()
    db.prepare('DELETE FROM product_modifiers WHERE id = ?').run(id)
  }

  static createOption(data: unknown) {
    const parsed = ModifierOptionSchema.parse(data)
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO modifier_options (modifier_id, name, price, is_default)
      VALUES (?, ?, ?, ?)
    `).run(parsed.modifier_id, parsed.name, parsed.price, parsed.is_default ? 1 : 0)
    return db.prepare('SELECT * FROM modifier_options WHERE id = ?').get(result.lastInsertRowid)
  }

  static deleteOption(id: number) {
    const db = getDatabase()
    db.prepare('DELETE FROM modifier_options WHERE id = ?').run(id)
  }
}
