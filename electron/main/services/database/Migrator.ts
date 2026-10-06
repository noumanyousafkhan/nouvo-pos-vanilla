import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getDatabase, runInTransaction } from './Database'
import { logger } from '../utils/logger'
import { getAppPaths } from '../utils/paths'

interface Migration {
  version: number
  name: string
  sql: string
}

function loadMigrations(): Migration[] {
  const migrationsDir = join(getAppPaths().appRoot, 'migrations')

  if (!existsSync(migrationsDir)) {
    logger.warn({ migrationsDir }, 'Migrations folder not found')
    return []
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/)
    if (!match) throw new Error(`Invalid migration filename: ${file}`)
    return {
      version: parseInt(match[1], 10),
      name: match[2],
      sql: readFileSync(join(migrationsDir, file), 'utf-8')
    }
  })
}

export function runMigrations(): void {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS version (
      id INTEGER PRIMARY KEY,
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const migrations = loadMigrations()

  if (migrations.length === 0) {
    logger.info('No migrations found')
    return
  }

  const applied = db
    .prepare('SELECT version FROM version ORDER BY version')
    .all() as { version: number }[]
  const appliedVersions = new Set(applied.map((r) => r.version))

  const pending = migrations.filter((m) => !appliedVersions.has(m.version))

  if (pending.length === 0) {
    logger.info('No pending migrations')
    return
  }

  logger.info({ count: pending.length }, 'Running migrations')

  for (const migration of pending) {
    logger.info({ version: migration.version, name: migration.name }, 'Applying migration')

    runInTransaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO version (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name
      )
    })
  }

  logger.info('All migrations applied')
}

export function getCurrentSchemaVersion(): number {
  const db = getDatabase()
  const row = db
    .prepare('SELECT MAX(version) as v FROM version')
    .get() as { v: number | null }
  return row.v ?? 0
}
