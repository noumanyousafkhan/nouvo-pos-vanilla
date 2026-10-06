import { handle } from './index'
import { AuthService } from '../services/auth/AuthService'
import { getSessionUser } from '../services/auth/SessionService'
import { getDatabase } from '../services/database/Database'

export function registerAuthIpc(): void {
  handle('auth:login', (username: string, password: string) =>
    AuthService.login(username, password)
  )

  handle('auth:logout', (token: string) => {
    AuthService.logout(token)
    return { ok: true }
  })

  handle('auth:me', (token: string) => {
    const user = getSessionUser(token)
    if (!user) return null
    const db = getDatabase()
    const full = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?').get(user.id)
    return full ?? null
  })

  handle('auth:hasAnyUser', () => AuthService.hasAnyUser())

  handle('auth:createInitialAdmin', (username: string, password: string) =>
    AuthService.createInitialSuperAdmin(username, password)
  )
}
