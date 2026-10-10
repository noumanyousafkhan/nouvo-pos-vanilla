import { handle } from './index'
import { HwidService } from '../services/license/HwidService'
import {
  activateLicense,
  getLicenseSummary,
  loadLicense,
  validateLicense,
  deleteLicense
} from '../services/license/LicenseService'

export function registerLicenseIpc(): void {
  /**
   * Get this machine's HWID — customer shares this with vendor.
   */
  handle('license:getMachineId', () => ({
    formatted: HwidService.getFormattedHwid(),
    raw: HwidService.getFullHwid()
  }))

  /**
   * Current license summary — for UI banners.
   */
  handle('license:getStatus', () => getLicenseSummary())

  /**
   * Raw signed license — for debug.
   */
  handle('license:getCurrent', () => loadLicense())

  /**
   * Full validation.
   */
  handle('license:validate', () => validateLicense())

  /**
   * Activate from base64-encoded license string.
   * Throws on error — handle() wraps it as { ok: false, error }.
   */
  handle('license:activate', (encoded: string) => {
    return activateLicense(String(encoded || ''))
  })

  /**
   * Delete license (for testing / reactivation).
   */
  handle('license:delete', () => {
    deleteLicense()
    return { success: true }
  })
}
