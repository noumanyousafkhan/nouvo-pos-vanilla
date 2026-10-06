import { dialog } from 'electron'
import { join, extname } from 'path'
import { copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'fs'
import { getAppPaths } from '../utils/paths'
import { AppError } from '../utils/errors'

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.webp']
const MAX_SIZE_KB = 500

export class ProductImageService {
  static async pickAndSave(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select Product Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths[0]) return null

    const sourcePath = result.filePaths[0]
    const ext = extname(sourcePath).toLowerCase()

    if (!ALLOWED_EXT.includes(ext)) {
      throw new AppError('INVALID_FILE_TYPE', `Allowed: ${ALLOWED_EXT.join(', ')}`)
    }

    const stat = statSync(sourcePath)
    if (stat.size > MAX_SIZE_KB * 1024) {
      throw new AppError('FILE_TOO_LARGE', `Image must be < ${MAX_SIZE_KB} KB`)
    }

    const paths = getAppPaths()
    const productsDir = join(paths.dataRoot, 'Products')
    if (!existsSync(productsDir)) mkdirSync(productsDir, { recursive: true })

    const filename = `product_${Date.now()}${ext}`
    const dest = join(productsDir, filename)
    copyFileSync(sourcePath, dest)

    return dest
  }

  static delete(imagePath: string): void {
    if (!imagePath || !existsSync(imagePath)) return
    const paths = getAppPaths()
    const productsDir = join(paths.dataRoot, 'Products')
    if (!imagePath.startsWith(productsDir)) return
    try {
      unlinkSync(imagePath)
    } catch {
      // ignore
    }
  }
}
