import { getDatabase } from '../database/Database'
import { logger } from '../utils/logger'

export type AuditAction =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.password.changed'
  | 'user.created'
  | 'user.updated'
  | 'user.disabled'
  | 'user.enabled'
  | 'license.activated'
  | 'license.renewed'
  | 'license.expired'
  | 'license.invalid'
  | 'license.tampered'
  | 'machine.mismatch'
  | 'clock.rollback'
  | 'settings.updated'
  | 'backup.created'
  | 'backup.restored'
  | 'backup.deleted'
  | 'menu.category.created'
  | 'menu.category.updated'
  | 'menu.category.deleted'
  | 'menu.product.created'
  | 'menu.product.updated'
  | 'menu.product.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted'
  | 'order.created'
  | 'order.voided'
  | 'order.restored'
  | 'order.reprinted'
  | 'order.printed'
  | 'export.generated'
  | 'system.update.applied'
  | 'security.permission_denied'
  | 'deal.items_replaced'
  | 'deal.toggled'
  | 'menu.category.toggled'
  | 'menu.category.reordered'
  | 'menu.product.toggled'

export class AuditService {
  static log(action: AuditAction, details?: Record<string, any>, userId?: number): void {
    try {
      const db = getDatabase()
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, ?, ?)
      `).run(userId ?? null, action, details ? JSON.stringify(details) : null)
    } catch (err) {
      logger.error({ err, action }, 'Audit log write failed')
    }
  }

  static list(filters: { action?: string; userId?: number; limit?: number } = {}): any[] {
    const db = getDatabase()
    const conditions: string[] = []
    const params: any[] = []

    if (filters.action) {
      conditions.push('action LIKE ?')
      params.push(`%${filters.action}%`)
    }
    if (filters.userId) {
      conditions.push('user_id = ?')
      params.push(filters.userId)
    }

    let sql = 'SELECT * FROM audit_logs'
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY created_at DESC LIMIT ?'
    params.push(filters.limit ?? 100)

    return db.prepare(sql).all(...params) as any[]
  }
}
