import { getDatabase } from '../database/Database'

export class NumberGenerator {
  static nextOrderNumber(prefix = 'ORD'): string {
    const db = getDatabase()
    const now = new Date()
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    const row = db.prepare(
      'SELECT id, last_number FROM order_counter WHERE prefix = ? AND date_key = ?'
    ).get(prefix, dateKey) as { id: number; last_number: number } | undefined

    let nextNum: number
    if (row) {
      nextNum = row.last_number + 1
      db.prepare("UPDATE order_counter SET last_number = ?, updated_at = datetime('now') WHERE id = ?")
        .run(nextNum, row.id)
    } else {
      nextNum = 1
      db.prepare('INSERT INTO order_counter (prefix, date_key, last_number) VALUES (?, ?, ?)')
        .run(prefix, dateKey, nextNum)
    }

    return `${prefix}-${dateKey}-${String(nextNum).padStart(4, '0')}`
  }

  static nextInvoiceNumber(prefix = 'INV'): string {
    const db = getDatabase()
    const row = db.prepare('SELECT id, last_number FROM invoice_counter WHERE prefix = ?')
      .get(prefix) as { id: number; last_number: number } | undefined

    let nextNum: number
    if (row) {
      nextNum = row.last_number + 1
      db.prepare("UPDATE invoice_counter SET last_number = ?, updated_at = datetime('now') WHERE id = ?")
        .run(nextNum, row.id)
    } else {
      nextNum = 1
      db.prepare('INSERT INTO invoice_counter (prefix, last_number) VALUES (?, ?)')
        .run(prefix, nextNum)
    }

    return `${prefix}-${String(nextNum).padStart(4, '0')}`
  }
}
