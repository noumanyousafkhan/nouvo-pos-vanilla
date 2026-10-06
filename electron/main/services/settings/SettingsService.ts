import { getDatabase } from '../database/Database'
import { logger } from '../utils/logger'
import { AuditService } from '../audit/AuditService'
import { BusinessSettingsSchema, ReceiptSettingsSchema, PrinterSettingsSchema, OrderSettingsSchema, SystemSettingsSchema } from './schemas'

export class SettingsService {
  static get(key: string): string | null {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  static set(key: string, value: string, userId?: number): void {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(key, value)
    AuditService.log('settings.updated', { key }, userId)
  }

  static getAll(): Record<string, string> {
    const db = getDatabase()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  static getBoolean(key: string, fallback = false): boolean {
    const v = this.get(key)
    if (v === null) return fallback
    return v === 'true' || v === '1'
  }

  static getNumber(key: string, fallback = 0): number {
    const v = this.get(key)
    if (v === null) return fallback
    const n = parseFloat(v)
    return isNaN(n) ? fallback : n
  }

  static getJSON<T>(key: string, fallback: T): T {
    const v = this.get(key)
    if (v === null) return fallback
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }

  static getBusiness() {
    return {
      name: this.get('business.name') ?? 'NOUVO POS Vanilla',
      logo_path: this.get('business.logo_path') ?? '',
      address: this.get('business.address') ?? 'Mansehra KPK Pakistan',
      phone_1: this.get('business.phone_1') ?? '03114521220',
      phone_2: this.get('business.phone_2') ?? '',
      email: this.get('business.email') ?? 'havenirnomi@gmail.com',
      website: this.get('business.website') ?? '',
      slogan: this.get('business.slogan') ?? 'NOUVO POS By: Nouman Khan',
      currency_symbol: this.get('business.currency_symbol') ?? 'Rs.',
      currency_code: this.get('business.currency_code') ?? 'PKR',
      tax_rate: this.getNumber('business.tax_rate', 0),
      tax_label: this.get('business.tax_label') ?? 'Tax',
      tax_inclusive: this.getBoolean('business.tax_inclusive', false)
    }
  }

  static getReceipt() {
    return {
      header_line_1: this.get('receipt.header_line_1') ?? '',
      header_line_2: this.get('receipt.header_line_2') ?? '',
      footer_line_1: this.get('receipt.footer_line_1') ?? 'Thank you for visiting!',
      footer_line_2: this.get('receipt.footer_line_2') ?? 'Please come again',
      show_logo: this.getBoolean('receipt.show_logo', true),
      show_tax: this.getBoolean('receipt.show_tax', true),
      show_customer: this.getBoolean('receipt.show_customer', true),
      show_table: this.getBoolean('receipt.show_table', true),
      show_order_type: this.getBoolean('receipt.show_order_type', true),
      show_qr: this.getBoolean('receipt.show_qr', false),
      copies_customer: this.getNumber('receipt.copies_customer', 1),
      copies_kitchen: this.getNumber('receipt.copies_kitchen', 1),
      kitchen_show_prices: this.getBoolean('receipt.kitchen_show_prices', false),
      width_mm: this.getNumber('receipt.width_mm', 80),
      char_width: this.getNumber('receipt.char_width', 42)
    }
  }

  static getPrinter() {
    return {
      name: this.get('printer.name') ?? '',
      type: this.get('printer.type') ?? 'thermal',
      connection: this.get('printer.connection') ?? 'usb',
      address: this.get('printer.address') ?? '',
      port: this.getNumber('printer.port', 9100),
      width_mm: this.getNumber('printer.width_mm', 80),
      cut_enabled: this.getBoolean('printer.cut_enabled', true),
      beep_enabled: this.getBoolean('printer.beep_enabled', false),
      open_drawer: this.getBoolean('printer.open_drawer', false)
    }
  }

  static getOrder() {
    return {
      delivery_charge_default: this.getNumber('order.delivery_charge_default', 0),
      delivery_charge_enabled: this.getBoolean('order.delivery_charge_enabled', true),
      order_types: this.getJSON<string[]>('order.order_types', ['dine_in', 'takeaway', 'delivery']),
      default_order_type: this.get('order.default_order_type') ?? 'takeaway',
      require_customer_for_delivery: this.getBoolean('order.require_customer_for_delivery', true),
      require_table_for_dine_in: this.getBoolean('order.require_table_for_dine_in', false),
      auto_print_on_checkout: this.getBoolean('order.auto_print_on_checkout', true),
      invoice_prefix: this.get('order.invoice_prefix') ?? 'INV',
      order_prefix: this.get('order.order_prefix') ?? 'ORD',
      discount_enabled: this.getBoolean('order.discount_enabled', true),
      discount_max_percent: this.getNumber('order.discount_max_percent', 100)
    }
  }

  static getSystem() {
    return {
      backup_enabled: this.getBoolean('system.backup_enabled', true),
      backup_retention_days: this.getNumber('system.backup_retention_days', 30),
      backup_time: this.get('system.backup_time') ?? '02:00',
      update_channel: this.get('system.update_channel') ?? 'stable',
      auto_check_updates: this.getBoolean('system.auto_check_updates', true),
      auto_download_updates: this.getBoolean('system.auto_download_updates', false),
      language: this.get('system.language') ?? 'en',
      theme: this.get('system.theme') ?? 'light',
      date_format: this.get('system.date_format') ?? 'DD-MM-YYYY',
      time_format: this.get('system.time_format') ?? '12h',
      audit_retention_days: this.getNumber('system.audit_retention_days', 0)
    }
  }

  static updateBusiness(data: unknown, userId?: number) {
    const parsed = BusinessSettingsSchema.parse(data)
    for (const [k, v] of Object.entries(parsed)) {
      this.set(`business.${k}`, typeof v === 'boolean' ? String(v) : String(v), userId)
    }
  }

  static updateReceipt(data: unknown, userId?: number) {
    const parsed = ReceiptSettingsSchema.parse(data)
    for (const [k, v] of Object.entries(parsed)) {
      this.set(`receipt.${k}`, typeof v === 'boolean' ? String(v) : String(v), userId)
    }
  }

  static updatePrinter(data: unknown, userId?: number) {
    const parsed = PrinterSettingsSchema.parse(data)
    for (const [k, v] of Object.entries(parsed)) {
      this.set(`printer.${k}`, typeof v === 'boolean' ? String(v) : String(v), userId)
    }
  }

  static updateOrder(data: unknown, userId?: number) {
    const parsed = OrderSettingsSchema.parse(data)
    for (const [k, v] of Object.entries(parsed)) {
      const val = Array.isArray(v) ? JSON.stringify(v) : (typeof v === 'boolean' ? String(v) : String(v))
      this.set(`order.${k}`, val, userId)
    }
  }

  static updateSystem(data: unknown, userId?: number) {
    const parsed = SystemSettingsSchema.parse(data)
    for (const [k, v] of Object.entries(parsed)) {
      this.set(`system.${k}`, typeof v === 'boolean' ? String(v) : String(v), userId)
    }
  }
}
