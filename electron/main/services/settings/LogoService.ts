import { dialog } from 'electron'
import { join, extname } from 'path'
import { copyFileSync, existsSync, mkdirSync, statSync } from 'fs'
import { getAppPaths } from '../utils/paths'
import { AppError } from '../utils/errors'
import { SettingsService } from './SettingsService'

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.svg']
const MAX_SIZE = 2 * 1024 * 1024

export class LogoService {
  static async saveLogo(sourcePath: string): Promise<string> {
    if (!existsSync(sourcePath)) {
      throw new AppError('FILE_NOT_FOUND', 'Logo file not found')
    }

    const ext = extname(sourcePath).toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      throw new AppError('INVALID_FILE_TYPE', `Allowed: ${ALLOWED_EXT.join(', ')}`)
    }

    const stat = statSync(sourcePath)
    if (stat.size > MAX_SIZE) {
      throw new AppError('FILE_TOO_LARGE', 'Logo must be < 2 MB')
    }

    const paths = getAppPaths()
    if (!existsSync(paths.logoDir)) mkdirSync(paths.logoDir, { recursive: true })

    const dest = join(paths.logoDir, `logo${ext}`)
    copyFileSync(sourcePath, dest)

    SettingsService.set('business.logo_path', dest)
    return dest
  }

  static async pickAndSave(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select Logo',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths[0]) return null
    return this.saveLogo(result.filePaths[0])
  }

  static getLogoFilePath(): string | null {
    const p = SettingsService.get('business.logo_path')
    if (!p || !existsSync(p)) return null
    return p
  }
}
