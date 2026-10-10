import { verify as cryptoVerify, createPublicKey } from 'crypto'
import { join } from 'path'
import { existsSync, writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'fs'
import { HwidService } from './HwidService'
import { getDatabase } from '../database/Database'
import { getAppPaths } from '../utils/paths'
import { logger } from '../utils/logger'

/**
 * Ed25519-based license service.
 *
 * Vendor tool pre-calculates final expiresAt for all modes:
 *   - replace (New / Renew) — expiresAt = issuedAt + days
 *   - extend — expiresAt = currentExpiry + extraDays
 *   - revoke — signals POS to delete license
 *
 * POS app just verifies signature + machine binding + uses expiresAt.
 */

const PUBLIC_KEY_HEX = 'f6f617b7d85bde4778447811d081c450e8f1dcab79aa204be31508b8dcafd7a3'

export type LicenseMode = 'replace' | 'extend' | 'revoke'

export interface LicensePayload {
  licenseId: string
  product: string
  machineId: string
  customer: string
  phone?: string
  cnic?: string
  email?: string
  mode: LicenseMode
  daysToAdd: number
  issuedAt: string
  expiresAt: string
}

export interface SignedLicense {
  payload: LicensePayload
  signature: string
}

export type LicenseStatus =
  | 'valid'
  | 'missing'
  | 'invalid_format'
  | 'invalid_signature'
  | 'machine_mismatch'
  | 'product_mismatch'
  | 'expired'
  | 'clock_tampered'
  | 'revoked'

export interface ValidationResult {
  status: LicenseStatus
  license: SignedLicense | null
  daysRemaining: number | null
  expiryWarning: 'none' | 'yellow' | 'orange' | 'red' | 'expired'
  message: string
}

// ─── Crypto helpers ───

function buildPublicKeyFromHex(hex: string) {
  const raw = Buffer.from(hex, 'hex')
  if (raw.length !== 32) throw new Error('Public key must be 32 bytes')
  const prefix = Buffer.from('302a300506032b6570032100', 'hex')
  const der = Buffer.concat([prefix, raw])
  return createPublicKey({ key: der, format: 'der', type: 'spki' })
}

function canonicalize(payload: LicensePayload): Buffer {
  return Buffer.from(JSON.stringify(payload), 'utf-8')
}

export function verifySignature(payload: LicensePayload, signatureBase64: string): boolean {
  try {
    const pubKey = buildPublicKeyFromHex(PUBLIC_KEY_HEX)
    const data = canonicalize(payload)
    const signature = Buffer.from(signatureBase64, 'base64')
    return cryptoVerify(null, data, pubKey, signature)
  } catch (err) {
    logger.warn({ err }, 'Signature verification failed')
    return false
  }
}

// ─── File path ───

function getLicenseFilePath(): string {
  const paths = getAppPaths()
  const dir = join(paths.configDir, 'License')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'license.json')
}

// ─── Load / Save ───

export function loadLicense(): SignedLicense | null {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT license_json FROM license LIMIT 1').get() as
      | { license_json: string }
      | undefined
    if (row?.license_json) {
      return JSON.parse(row.license_json) as SignedLicense
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to load license from DB')
  }

  try {
    const path = getLicenseFilePath()
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8').trim()
      if (raw) return JSON.parse(raw) as SignedLicense
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to load license from disk')
  }

  return null
}

export function saveLicense(license: SignedLicense): void {
  const db = getDatabase()
  const json = JSON.stringify(license)

  db.prepare('DELETE FROM license').run()
  db.prepare(`
    INSERT INTO license (
      machine_id, license_json, customer, issued_at, expiry, activated_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(
    license.payload.machineId,
    json,
    license.payload.customer,
    license.payload.issuedAt,
    license.payload.expiresAt
  )

  try {
    const path = getLicenseFilePath()
    writeFileSync(path, json, { mode: 0o600 })
  } catch (err) {
    logger.warn({ err }, 'Failed to write license backup')
  }

  logger.info(
    {
      customer: license.payload.customer,
      expiry: license.payload.expiresAt,
      mode: license.payload.mode
    },
    'License saved'
  )
}

export function deleteLicense(): void {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM license').run()
  } catch { /* ignore */ }

  try {
    const path = getLicenseFilePath()
    if (existsSync(path)) unlinkSync(path)
  } catch { /* ignore */ }

  logger.info('License deleted')
}

// ─── Validation ───

export function validateLicense(): ValidationResult {
  const license = loadLicense()

  if (!license) {
    return {
      status: 'missing',
      license: null,
      daysRemaining: null,
      expiryWarning: 'none',
      message: 'No license found. Please activate.'
    }
  }

  if (!verifySignature(license.payload, license.signature)) {
    return {
      status: 'invalid_signature',
      license,
      daysRemaining: null,
      expiryWarning: 'none',
      message: 'License signature is invalid.'
    }
  }

  const currentHwid = HwidService.getFullHwid()
  if (license.payload.machineId !== currentHwid) {
    return {
      status: 'machine_mismatch',
      license,
      daysRemaining: null,
      expiryWarning: 'none',
      message: 'License was issued for a different machine.'
    }
  }

  const issuedMs = new Date(license.payload.issuedAt).getTime()
  if (issuedMs > Date.now() + 60 * 60 * 1000) {
    return {
      status: 'clock_tampered',
      license,
      daysRemaining: null,
      expiryWarning: 'none',
      message: 'System clock appears to be set incorrectly.'
    }
  }

  const expiryMs = new Date(license.payload.expiresAt).getTime()
  const daysRemaining = Math.ceil((expiryMs - Date.now()) / 86400_000)

  if (daysRemaining <= 0) {
    return {
      status: 'expired',
      license,
      daysRemaining: 0,
      expiryWarning: 'expired',
      message: 'License has expired. Please renew.'
    }
  }

  let warning: ValidationResult['expiryWarning'] = 'none'
  if (daysRemaining <= 1) warning = 'red'
  else if (daysRemaining <= 3) warning = 'orange'
  else if (daysRemaining <= 7) warning = 'yellow'

  return {
    status: 'valid',
    license,
    daysRemaining,
    expiryWarning: warning,
    message: 'License is valid.'
  }
}

// ─── Parse ───

export function parseBase64License(encoded: string): SignedLicense {
  const trimmed = String(encoded || '').trim()
  if (!trimmed) throw new Error('License is empty')

  let decoded: string
  try {
    decoded = Buffer.from(trimmed, 'base64').toString('utf-8')
  } catch {
    throw new Error('Invalid base64 encoding')
  }

  let parsed: any
  try {
    parsed = JSON.parse(decoded)
  } catch {
    throw new Error('License content is not valid JSON')
  }

  if (!parsed?.payload || !parsed?.signature) {
    throw new Error('License is missing payload or signature')
  }

  if (!parsed.payload.machineId) {
    throw new Error('License is missing machine ID')
  }

  return parsed as SignedLicense
}

// ─── Activation ───

export function activateLicense(encoded: string): ValidationResult {
  const signed = parseBase64License(encoded)

  // Verify signature
  if (!verifySignature(signed.payload, signed.signature)) {
    throw new Error('License signature is invalid — file may be tampered.')
  }

  // Machine binding
  const currentHwid = HwidService.getFullHwid()
  if (signed.payload.machineId !== currentHwid) {
    throw new Error('License was issued for a different machine.')
  }

  const mode: LicenseMode = (signed.payload.mode as LicenseMode) || 'replace'

  // ─── REVOKE ───
  if (mode === 'revoke') {
    deleteLicense()
    throw new Error('License has been revoked by vendor. Please contact support.')
  }

  // ─── REPLACE / EXTEND ───
  // Both have final expiresAt pre-calculated by the generator tool.
  const expiryMs = new Date(signed.payload.expiresAt).getTime()
  if (expiryMs <= Date.now()) {
    throw new Error('License has already expired.')
  }

  // If customer is empty (Renew / Extend), preserve existing customer info
  if (!signed.payload.customer) {
    const current = loadLicense()
    if (current) {
      signed.payload.customer = current.payload.customer || ''
      signed.payload.phone = current.payload.phone || ''
      signed.payload.cnic = current.payload.cnic || ''
      signed.payload.email = current.payload.email || ''
    }
  }

  saveLicense(signed)
  return validateLicense()
}

// ─── Summary ───

export function getLicenseSummary() {
  const result = validateLicense()
  return {
    status: result.status,
    valid: result.status === 'valid',
    licenseId: result.license?.payload.licenseId ?? null,
    customer: result.license?.payload.customer ?? null,
    phone: result.license?.payload.phone ?? null,
    cnic: result.license?.payload.cnic ?? null,
    email: result.license?.payload.email ?? null,
    product: result.license?.payload.product ?? null,
    machineId: result.license?.payload.machineId ?? null,
    mode: result.license?.payload.mode ?? null,
    issuedAt: result.license?.payload.issuedAt ?? null,
    expiresAt: result.license?.payload.expiresAt ?? null,
    daysRemaining: result.daysRemaining,
    warning: result.expiryWarning,
    message: result.message
  }
}
