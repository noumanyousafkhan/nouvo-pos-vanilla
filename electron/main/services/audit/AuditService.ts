import { getDatabase } from '../database/Database'
import { logger } from '../utils/logger'

export type AuditAction =
  // Auth
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.password.changed'
  | 'user.created'
  // Order
  | 'order.created'
  | 'order.completed'
  | 'order.voided'
  | 'order.restored'
  | 'order.printed'
  | 'order.reprinted'
  // Menu
  | 'menu.category.created'
  | 'menu.category.updated'
  | 'menu.category.deleted'
  | 'menu.category.toggled'
  | 'menu.category.reordered'
  | 'menu.product.created'
  | 'menu.product.updated'
  | 'menu.product.deleted'
  | 'menu.product.toggled'
  // Deals
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted'
  | 'deal.toggled'
  | 'deal.items_replaced'
  // Settings
  | 'settings.updated'
  // Backup
  | 'backup.created'
  | 'backup.restored'
  | 'backup.deleted'
  // Export
  | 'export.generated'

export class AuditService {
  static log(action: AuditAction, details?: any, userId?: number): void {
    try {
      const db = getDatabase()
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, ?, ?)
      `).run(
        userId ?? null,
        action,
        details ? JSON.stringify(details) : null
      )
      logger.debug({ action, userId }, 'Audit log')
    } catch (err) {
      logger.error({ err, action }, 'Audit log failed')
    }
  }

  static list(filters?: { userId?: number; action?: string; limit?: number }): any[] {
    const db = getDatabase()
    const conditions: string[] = []
    const params: any[] = []

    if (filters?.userId) {
      conditions.push('user_id = ?')
      params.push(filters.userId)
    }
    if (filters?.action) {
      conditions.push('action = ?')
      params.push(filters.action)
    }

    let sql = 'SELECT * FROM audit_logs'
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY id DESC LIMIT ?'
    params.push(filters?.limit ?? 100)

    return db.prepare(sql).all(...params) as any[]
  }
}
