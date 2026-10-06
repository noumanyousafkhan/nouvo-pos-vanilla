import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export interface AppPaths {
  appRoot: string
  dataRoot: string
  databaseDir: string
  databaseFile: string
  backupsDir: string
  exportsDir: string
  logoDir: string
  logsDir: string
  tempDir: string
  configDir: string
  updatesDir: string
}

let cachedPaths: AppPaths | null = null

export function getAppPaths(): AppPaths {
  if (cachedPaths) return cachedPaths

  const appRoot = app.getAppPath()
  const dataRoot = app.getPath('userData')

  const paths: AppPaths = {
    appRoot,
    dataRoot,
    databaseDir: join(dataRoot, 'Database'),
    databaseFile: join(dataRoot, 'Database', 'nouvo.db'),
    backupsDir: join(dataRoot, 'Backups'),
    exportsDir: join(dataRoot, 'Exports'),
    logoDir: join(dataRoot, 'Logo'),
    logsDir: join(dataRoot, 'Logs'),
    tempDir: join(dataRoot, 'Temp'),
    configDir: join(dataRoot, 'Config'),
    updatesDir: join(dataRoot, 'Updates')
  }

  const dirs = [
    paths.databaseDir,
    paths.backupsDir,
    paths.exportsDir,
    paths.logoDir,
    paths.logsDir,
    paths.tempDir,
    paths.configDir,
    paths.updatesDir
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  cachedPaths = paths
  return paths
}
