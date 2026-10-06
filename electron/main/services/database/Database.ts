import Database from 'better-sqlite3'
import { logger } from '../utils/logger'

let db: Database.Database | null = null

export function initDatabase(filePath: string): Database.Database {
  if (db) return db

  db = new Database(filePath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 30000000000')

  logger.info({ filePath }, 'SQLite database opened')
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    logger.info('SQLite database closed')
  }
}

export function runInTransaction<T>(fn: () => T): T {
  const database = getDatabase()
  const tx = database.transaction(fn)
  return tx()
}
