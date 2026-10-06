import { getDatabase, closeDatabase, initDatabase } from '../database/Database'
import { getAppPaths } from '../utils/paths'
import { join } from 'path'
import { copyFileSync, existsSync, statSync, unlinkSync, readFileSync } from 'fs'
import { createHash } from 'crypto'
import { AuditService } from '../audit/AuditService'
import { SettingsService } from '../settings/SettingsService'
import { getCurrentSchemaVersion } from '../database/Migrator'
import { AppError, NotFoundError } from '../utils/errors'
import { logger } from '../utils/logger'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { CreateBackupSchema, RestoreBackupSchema } from './schemas'

export interface BackupRecord {
  id: number
  path: string
  size: number
  type: 'auto' | 'manual' | 'pre_restore'
  created_at: string
  checksum: string | null
  schema_version: number | null
  app_version: string | null
  note: string | null
}

export class BackupService {
  private static computeChecksum(filePath: string): string {
    const buffer = readFileSync(filePath)
    return createHash('sha256').update(buffer).digest('hex')
  }

  private static backupFilename(type: string): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    return `backup_${type}_${ts}.db`
  }

  static validateBackupFile(filePath: string): { valid: boolean; error?: string } {
    if (!existsSync(filePath)) return { valid: false, error: 'File not found' }

    try {
      const tempDb = new Database(filePath, { readonly: true })
      const result = tempDb.prepare('PRAGMA integrity_check').get() as any

      if (result?.integrity_check !== 'ok') {
        tempDb.close()
        return { valid: false, error: `Integrity check failed: ${result?.integrity_check}` }
      }

      const tables = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
      tempDb.close()

      const required = ['orders', 'order_items', 'products', 'categories', 'users']
      const present = new Set(tables.map((t: any) => t.name))
      for (const req of required) {
        if (!present.has(req)) return { valid: false, error: `Missing required table: ${req}` }
      }

      return { valid: true }
    } catch (err: any) {
      return { valid: false, error: err.message }
    }
  }

  static createBackup(data: unknown, userId?: number): BackupRecord {
    const parsed = CreateBackupSchema.parse(data)

    const db = getDatabase()
    const paths = getAppPaths()

    const filename = this.backupFilename(parsed.type)
    const destPath = join(paths.backupsDir, filename)

    logger.info({ type: parsed.type, destPath }, 'Creating backup')

    try {
      db.pragma('wal_checkpoint(TRUNCATE)')

      const sourcePath = join(paths.databaseDir, 'nouvo.db')
      copyFileSync(sourcePath, destPath)

      const size = statSync(destPath).size
      const checksum = this.computeChecksum(destPath)
      const schemaVersion = getCurrentSchemaVersion()
      const appVersion = app.getVersion()

      const result = db.prepare(`
        INSERT INTO backups (path, size, type, checksum, schema_version, app_version, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(destPath, size, parsed.type, checksum, schemaVersion, appVersion, parsed.note || null)

      const record = this.getBackup(Number(result.lastInsertRowid))

      AuditService.log('backup.created', {
        backupId: record.id,
        type: parsed.type,
        path: destPath,
        size
      }, userId)

      logger.info({ backupId: record.id, size }, 'Backup created')
      return record
    } catch (err: any) {
      logger.error({ err, destPath }, 'Backup creation failed')
      if (existsSync(destPath)) {
        try { unlinkSync(destPath) } catch {}
      }
      throw new AppError('BACKUP_FAILED', `Backup failed: ${err.message}`)
    }
  }

  static getBackup(id: number): BackupRecord {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM backups WHERE id = ?').get(id) as BackupRecord | undefined
    if (!row) throw new NotFoundError('Backup not found')
    return row
  }

  static listBackups(limit = 100): BackupRecord[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM backups ORDER BY created_at DESC LIMIT ?').all(limit) as BackupRecord[]
  }

  static deleteBackup(id: number, userId?: number): void {
    const db = getDatabase()
    const record = this.getBackup(id)

    if (existsSync(record.path)) {
      try { unlinkSync(record.path) } catch {}
    }

    db.prepare('DELETE FROM backups WHERE id = ?').run(id)
    AuditService.log('backup.deleted', { backupId: id, path: record.path }, userId)
  }

  static cleanupOldBackups(): number {
    const db = getDatabase()
    const retentionDays = SettingsService.getNumber('backup.retention_days', 30)
    const maxCount = SettingsService.getNumber('backup.max_count', 100)
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

    const oldByAge = db.prepare(
      "SELECT id, path FROM backups WHERE created_at < ? AND type != 'pre_restore'"
    ).all(cutoff) as BackupRecord[]

    const oldByCount = db.prepare(`
      SELECT id, path FROM backups
      WHERE id NOT IN (SELECT id FROM backups ORDER BY created_at DESC LIMIT ?)
      AND type != 'pre_restore'
    `).all(maxCount) as BackupRecord[]

    const toDelete = new Map<number, string>()
    for (const b of oldByAge) toDelete.set(b.id, b.path)
    for (const b of oldByCount) toDelete.set(b.id, b.path)

    let deleted = 0
    for (const [id, path] of toDelete) {
      if (existsSync(path)) {
        try { unlinkSync(path) } catch {}
      }
      db.prepare('DELETE FROM backups WHERE id = ?').run(id)
      deleted++
    }

    if (deleted > 0) logger.info({ deleted }, 'Old backups cleaned up')
    return deleted
  }

  static runAutoBackupIfNeeded(): void {
    if (!SettingsService.getBoolean('backup.enabled', true)) return
    if (!SettingsService.getBoolean('backup.auto_on_start', true)) return

    const db = getDatabase()
    const today = new Date().toISOString().slice(0, 10)

    const existing = db.prepare(
      "SELECT id FROM backups WHERE type = 'auto' AND date(created_at) = ? LIMIT 1"
    ).get(today)

    if (existing) {
      logger.info('Auto backup already created today')
      return
    }

    logger.info('Running auto backup on start')
    try {
      this.createBackup({ type: 'auto', note: 'Auto backup on app start' })
      this.cleanupOldBackups()
    } catch (err) {
      logger.error({ err }, 'Auto backup failed')
    }
  }

  /**
   * Restore backup — business data only, USERS PRESERVED.
   * Current users stay intact so the logged-in session remains valid.
   */
  static restoreBackup(data: unknown, userId?: number): { ok: boolean; message: string } {
    const parsed = RestoreBackupSchema.parse(data)

    const record = this.getBackup(parsed.backupId)
    const paths = getAppPaths()

    if (!existsSync(record.path)) {
      throw new AppError('BACKUP_FILE_MISSING', 'Backup file not found on disk')
    }

    const validation = this.validateBackupFile(record.path)
    if (!validation.valid) {
      throw new AppError('BACKUP_INVALID', `Backup validation failed: ${validation.error}`)
    }

    if (record.checksum) {
      const actual = this.computeChecksum(record.path)
      if (actual !== record.checksum) {
        throw new AppError('BACKUP_CHECKSUM_MISMATCH', 'Backup file has been modified')
      }
    }

    logger.info({ backupId: record.id }, 'Starting restore (users preserved)')

    // 1. Save current users + sessions before restore
    const currentDb = getDatabase()
    const usersBackup = currentDb.prepare('SELECT * FROM users').all() as any[]
    const sessionsBackup = currentDb.prepare('SELECT * FROM sessions').all() as any[]

    logger.info({ userCount: usersBackup.length }, 'Current users saved')

    // 2. Pre-restore backup
    let preRestorePath: string | null = null
    try {
      const pre = this.createBackup({ type: 'pre_restore', note: `Before restoring backup #${record.id}` })
      preRestorePath = pre.path
    } catch (err) {
      logger.error({ err }, 'Pre-restore backup failed')
      throw new AppError('PRE_RESTORE_FAILED', 'Could not create safety backup. Restore aborted.')
    }

    const dbPath = join(paths.databaseDir, 'nouvo.db')

    try {
      closeDatabase()

      const oldPath = dbPath + '.old'
      if (existsSync(oldPath)) {
        try { unlinkSync(oldPath) } catch {}
      }
      copyFileSync(dbPath, oldPath)

      // 3. Replace DB with backup
      copyFileSync(record.path, dbPath)

      const walPath = dbPath + '-wal'
      const shmPath = dbPath + '-shm'
      if (existsSync(walPath)) { try { unlinkSync(walPath) } catch {} }
      if (existsSync(shmPath)) { try { unlinkSync(shmPath) } catch {} }

      initDatabase(dbPath)

      const restoredDb = getDatabase()

      // 4. Verify integrity
      const check = restoredDb.prepare('PRAGMA integrity_check').get() as any
      if (check?.integrity_check !== 'ok') {
        throw new Error(`Integrity check failed after restore: ${check?.integrity_check}`)
      }

      // 5. Restore users from before the backup
      //    (business data restored, but users stay as they were)
      const userColumns = Object.keys(usersBackup[0] || {})
      if (userColumns.length > 0) {
        // Clear any users that may have come from the backup
        restoredDb.prepare('DELETE FROM users').run()

        // Insert current users
        const userCols = userColumns.join(', ')
        const placeholders = userColumns.map(() => '?').join(', ')
        const insertUser = restoredDb.prepare(
          `INSERT INTO users (${userCols}) VALUES (${placeholders})`
        )

        for (const u of usersBackup) {
          insertUser.run(...userColumns.map((c) => u[c]))
        }

        logger.info({ userCount: usersBackup.length }, 'Users restored from current session')
      }

      // 6. Restore sessions
      if (sessionsBackup.length > 0) {
        restoredDb.prepare('DELETE FROM sessions').run()
        const sessionColumns = Object.keys(sessionsBackup[0])
        const sessionCols = sessionColumns.join(', ')
        const sessionPlaceholders = sessionColumns.map(() => '?').join(', ')
        const insertSession = restoredDb.prepare(
          `INSERT INTO sessions (${sessionCols}) VALUES (${sessionPlaceholders})`
        )
        for (const s of sessionsBackup) {
          insertSession.run(...sessionColumns.map((c) => s[c]))
        }
        logger.info({ sessionCount: sessionsBackup.length }, 'Sessions restored')
      }

      if (existsSync(oldPath)) {
        try { unlinkSync(oldPath) } catch {}
      }

      AuditService.log('backup.restored', {
        backupId: record.id,
        sourcePath: record.path,
        preRestorePath,
        usersPreserved: usersBackup.length
      }, userId)

      logger.info({ backupId: record.id }, 'Restore completed — users preserved')
      return {
        ok: true,
        message: 'Backup restored successfully. Business data recovered. Users preserved. Please restart the application.'
      }
    } catch (err: any) {
      logger.error({ err }, 'Restore failed — attempting rollback')

      try {
        const oldPath = dbPath + '.old'
        if (existsSync(oldPath)) {
          closeDatabase()
          copyFileSync(oldPath, dbPath)
          initDatabase(dbPath)
          unlinkSync(oldPath)
          logger.info('Rollback successful')
        }
      } catch (rollbackErr) {
        logger.error({ rollbackErr }, 'Rollback failed — manual intervention required')
      }

      throw new AppError('RESTORE_FAILED', `Restore failed: ${err.message}. Previous data recovered.`)
    }
  }

  static getStats() {
    const db = getDatabase()
    const row = db.prepare(`
      SELECT COUNT(*) as total, COALESCE(SUM(size), 0) as total_size, MAX(created_at) as last_backup
      FROM backups
    `).get() as any

    return {
      total: row.total,
      totalSize: row.total_size,
      lastBackup: row.last_backup,
      retentionDays: SettingsService.getNumber('backup.retention_days', 30),
      enabled: SettingsService.getBoolean('backup.enabled', true)
    }
  }
}
