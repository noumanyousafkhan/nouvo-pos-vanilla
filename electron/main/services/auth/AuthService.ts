import { getDatabase } from '../database/Database'
import { PasswordService } from './PasswordService'
import { createSession, destroySession } from './SessionService'
import { AuditService } from '../audit/AuditService'
import { AppError } from '../utils/errors'

export interface SafeUser {
  id: number
  username: string
  role: 'super_admin' | 'admin' | 'cashier'
  is_active: number
}

const failedAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(username: string): void {
  const now = Date.now()
  const entry = failedAttempts.get(username)
  if (!entry || entry.resetAt < now) {
    failedAttempts.set(username, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    throw new AppError('RATE_LIMITED', 'Too many failed attempts. Try again in 15 minutes.')
  }
}

function clearRateLimit(username: string): void {
  failedAttempts.delete(username)
}

export class AuthService {
  static async login(username: string, password: string): Promise<{
    token: string
    user: SafeUser
  }> {
    if (!username || !password) {
      throw new AppError('VALIDATION', 'Username and password required')
    }

    checkRateLimit(username)

    const db = getDatabase()
    const user = db.prepare(
      'SELECT id, username, password_hash, role, is_active FROM users WHERE username = ?'
    ).get(username) as any

    if (!user) {
      AuditService.log('auth.login.failure', { username, reason: 'not_found' })
      throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password')
    }

    if (!user.is_active) {
      AuditService.log('auth.login.failure', { username, reason: 'disabled' }, user.id)
      throw new AppError('USER_DISABLED', 'Account is disabled')
    }

    const valid = await PasswordService.verifyPassword(password, user.password_hash)
    if (!valid) {
      AuditService.log('auth.login.failure', { username, reason: 'wrong_password' }, user.id)
      throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password')
    }

    clearRateLimit(username)

    // Rehash if needed
    if (PasswordService.needsRehash(user.password_hash)) {
      const newHash = await PasswordService.hashPassword(password)
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id)
      AuditService.log('auth.password.changed', { reason: 'rehash' }, user.id)
    }

    const session = createSession(user.id)

    const safeUser: SafeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      is_active: user.is_active
    }

    AuditService.log('auth.login.success', { username }, user.id)

    return { token: session.token, user: safeUser }
  }

  static logout(token: string): void {
    destroySession(token)
    AuditService.log('auth.logout', {})
  }

  static hasAnyUser(): boolean {
    const db = getDatabase()
    const row = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    return row.c > 0
  }

  static async createInitialSuperAdmin(username: string, password: string): Promise<SafeUser> {
    const db = getDatabase()
    const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    if (count.c > 0) {
      throw new AppError('ALREADY_EXISTS', 'Users already exist')
    }

    if (!username || username.length < 3) {
      throw new AppError('VALIDATION', 'Username must be at least 3 characters')
    }
    if (!password || password.length < 8) {
      throw new AppError('VALIDATION', 'Password must be at least 8 characters')
    }

    const hash = await PasswordService.hashPassword(password)
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, 'super_admin')
    `).run(username, hash)

    const user = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as SafeUser

    AuditService.log('user.created', { username, role: 'super_admin' }, user.id)

    return user
  }
}
