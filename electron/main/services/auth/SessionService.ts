import { randomBytes } from 'crypto'
import { getDatabase } from '../database/Database'
import { SettingsService } from '../settings/SettingsService'
import { logger } from '../utils/logger'

export interface Session {
  id: number
  user_id: number
  token: string
  created_at: string
  expires_at: string
}

export interface SessionUser {
  id: number
  role: string
}

export function createSession(userId: number): Session {
  const db = getDatabase()
  const token = randomBytes(32).toString('hex')
  const ttlHours = SettingsService.getNumber('security.session.ttl_hours', 12)
  const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString()

  const result = db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, token, expiresAt)

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid) as Session
  logger.info({ userId, sessionId: session.id }, 'Session created')
  return session
}

export function getSessionUser(token: string): SessionUser | null {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT u.id, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `).get(token) as SessionUser | undefined
  return row ?? null
}

export function destroySession(token: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  logger.info({ token: token.slice(0, 8) + '...' }, 'Session destroyed')
}

export function cleanupExpiredSessions(): number {
  const db = getDatabase()
  const result = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run()
  if (result.changes > 0) {
    logger.info({ cleaned: result.changes }, 'Expired sessions cleaned')
  }
  return result.changes
}
