import { getDatabase } from '../database/Database'

export class NumberGenerator {
  /**
   * Order number: ORD-YYYYMMDD-0001
   * Invoice number: INV-YYYYMMDD0001
   */
  static nextOrderNumber(prefix: string = 'ORD'): string {
    const db = getDatabase()
    const now = new Date()
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    const tx = db.transaction(() => {
      const row = db.prepare(
        'SELECT last_number FROM order_counter WHERE prefix = ? AND date_key = ?'
      ).get(prefix, dateKey) as { last_number: number } | undefined

      let nextNumber = 1
      if (row) {
        nextNumber = row.last_number + 1
        db.prepare(
          'UPDATE order_counter SET last_number = ? WHERE prefix = ? AND date_key = ?'
        ).run(nextNumber, prefix, dateKey)
      } else {
        db.prepare(
          'INSERT INTO order_counter (prefix, date_key, last_number) VALUES (?, ?, ?)'
        ).run(prefix, dateKey, nextNumber)
      }

      return nextNumber
    })

    const num = tx()
    return `${prefix}-${dateKey}-${String(num).padStart(4, '0')}`
  }

  /**
   * Invoice: INV-YYYYMMDD0001
   */
  static nextInvoiceNumber(prefix: string = 'INV'): string {
    const db = getDatabase()
    const now = new Date()
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    const tx = db.transaction(() => {
      // Use date-scoped counter so format is INV-YYYYMMDD0001
      const compositeKey = `${prefix}-${dateKey}`
      const row = db.prepare(
        'SELECT last_number FROM invoice_counter WHERE prefix = ?'
      ).get(compositeKey) as { last_number: number } | undefined

      let nextNumber = 1
      if (row) {
        nextNumber = row.last_number + 1
        db.prepare(
          'UPDATE invoice_counter SET last_number = ? WHERE prefix = ?'
        ).run(nextNumber, compositeKey)
      } else {
        db.prepare(
          'INSERT INTO invoice_counter (prefix, last_number) VALUES (?, ?)'
        ).run(compositeKey, nextNumber)
      }

      return nextNumber
    })

    const num = tx()
    return `${prefix}-${dateKey}${String(num).padStart(4, '0')}`
  }
}
