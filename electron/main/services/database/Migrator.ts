import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { getDatabase } from './Database'
import { getAppPaths } from '../utils/paths'
import { logger } from '../utils/logger'

interface Migration {
  version: number
  name: string
  sql: string
}

/**
 * Load all migration files from disk.
 *
 * Dev:      <projectRoot>/migrations/
 * Packaged: <resourcesPath>/migrations/      (asar ke bahar)
 *           Fallback: <appRoot>/migrations/  (asar ke andar — agar bundled ho)
 */
function loadMigrations(): Migration[] {
  const paths = getAppPaths()

  // Build candidate paths — pehla jo exist kare woh use karein
  const candidates: string[] = [
    // Packaged build — resources folder (asar ke bahar)
    join(process.resourcesPath, 'migrations'),
    // Dev mode — project root
    join(paths.appRoot, 'migrations'),
    // Fallback — asar ke andar
    join(paths.appRoot, 'app.asar', 'migrations')
  ]

  let migrationsDir: string | null = null
  for (const dir of candidates) {
    if (existsSync(dir)) {
      migrationsDir = dir
      break
    }
  }

  if (!migrationsDir) {
    logger.warn({ candidates }, 'Migrations folder not found in any candidate path')
    return []
  }

  logger.info({ migrationsDir }, 'Loading migrations')

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const migrations: Migration[] = []

  for (const file of files) {
    const match = file.match(/^(\d+)_(.+)\.sql$/)
    if (!match) {
      logger.warn({ file }, 'Skipping invalid migration filename')
      continue
    }

    const version = Number(match[1])
    const name = match[2]
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')

    migrations.push({ version, name, sql })
  }

  return migrations
}

/**
 * Get the current schema version — highest applied migration number.
 * Used by BackupService for compatibility checks.
 */
export function getCurrentSchemaVersion(): number {
  const db = getDatabase()
  try {
    const row = db.prepare('SELECT MAX(version) as v FROM version').get() as { v: number | null } | undefined
    return row?.v ?? 0
  } catch {
    return 0
  }
}

/**
 * Run all pending migrations.
 * Safe to call multiple times — each version is applied only once.
 */
export function runMigrations(): void {
  const db = getDatabase()

  // Ensure version table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const appliedVersions = new Set(
    (db.prepare('SELECT version FROM version').all() as Array<{ version: number }>)
      .map((row) => row.version)
  )

  const migrations = loadMigrations()

  if (migrations.length === 0) {
    logger.info('No migrations found')
    return
  }

  const pending = migrations.filter((m) => !appliedVersions.has(m.version))

  if (pending.length === 0) {
    logger.info('No pending migrations')
    return
  }

  logger.info({ count: pending.length }, 'Running migrations')

  const tx = db.transaction(() => {
    for (const m of pending) {
      logger.info({ version: m.version, name: m.name }, 'Applying migration')
      db.exec(m.sql)
      db.prepare('INSERT INTO version (version, name) VALUES (?, ?)').run(m.version, m.name)
    }
  })

  tx()
  logger.info('All migrations applied')
}
