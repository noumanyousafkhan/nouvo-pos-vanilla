import { machineIdSync } from 'node-machine-id'
import { createHash } from 'crypto'
import { cpus, platform, arch, hostname } from 'os'
import { logger } from '../utils/logger'

/**
 * HWID — 32-character stable hardware fingerprint.
 *
 * Returns first 32 chars of SHA-256 hash (lowercase, no dashes).
 * Same format as formatted display (but lowercase, no dashes).
 */
export class HwidService {
  private static cachedRaw: string | null = null
  private static cachedFormatted: string | null = null

  static getRawHwid(): string {
    if (this.cachedRaw) return this.cachedRaw

    try {
      const parts: string[] = []

      try {
        parts.push('mid=' + machineIdSync(true))
      } catch {
        parts.push('mid=unavailable')
      }

      const cpuList = cpus()
      if (cpuList.length > 0) {
        parts.push('cpu=' + cpuList[0].model.trim())
      }

      parts.push('plat=' + platform())
      parts.push('arch=' + arch())
      parts.push('host=' + hostname())

      const combined = parts.join('|')
      const fullHash = createHash('sha256').update(combined).digest('hex')

      // ⭐ 32-char lowercase (no dashes) — same as customer sees (uppercase)
      const hwid32 = fullHash.slice(0, 32).toLowerCase()

      this.cachedRaw = hwid32
      logger.info({ hwidPrefix: hwid32.slice(0, 16) + '...' }, 'HWID generated (32-char)')
      return hwid32
    } catch (err) {
      logger.error({ err }, 'HWID generation failed')
      throw new Error('Could not generate HWID')
    }
  }

  /**
   * Formatted for display: A4F8-E2C1-B9D7-6E3F-8A2B-1C9D-4E7F-5A2B
   */
  static getFormattedHwid(): string {
    if (this.cachedFormatted) return this.cachedFormatted

    const raw = this.getRawHwid()
    const groups: string[] = []
    for (let i = 0; i < 32; i += 4) {
      groups.push(raw.slice(i, i + 4).toUpperCase())
    }
    const formatted = groups.join('-')
    this.cachedFormatted = formatted
    return formatted
  }

  static getFullHwid(): string {
    return this.getRawHwid()
  }

  static clearCache(): void {
    this.cachedRaw = null
    this.cachedFormatted = null
  }
}
