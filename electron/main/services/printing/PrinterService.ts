import { SettingsService } from '../settings/SettingsService'
import { OrderService } from '../orders/OrderService'
import { AuditService } from '../audit/AuditService'
import { ReceiptFormatter } from './ReceiptFormatter'
import { logger } from '../utils/logger'

export class PrinterService {
  static getConfig() {
    return {
      name: SettingsService.get('printer.name') ?? '',
      type: SettingsService.get('printer.type') ?? 'thermal',
      connection: SettingsService.get('printer.connection') ?? 'usb',
      address: SettingsService.get('printer.address') ?? '',
      port: SettingsService.getNumber('printer.port', 9100),
      width_mm: SettingsService.getNumber('printer.width_mm', 80),
      cut_enabled: SettingsService.getBoolean('printer.cut_enabled', true),
      beep_enabled: SettingsService.getBoolean('printer.beep_enabled', false),
      open_drawer: SettingsService.getBoolean('printer.open_drawer', false)
    }
  }

  /**
   * Print a receipt for an order.
   * Sale is NEVER rolled back on printer failure.
   */
  static async printReceipt(
    params: { orderId: number; type: 'customer' | 'kitchen'; copies?: number; isReprint?: boolean },
    userId?: number
  ): Promise<{ ok: boolean; error?: string; copies: number; preview?: string }> {
    const copies = params.copies ?? (params.type === 'kitchen'
      ? SettingsService.getNumber('receipt.copies_kitchen', 1)
      : SettingsService.getNumber('receipt.copies_customer', 1))

    try {
      const { order, items, payment } = OrderService.getFullOrder(params.orderId)
      const business = SettingsService.getBusiness()
      const receiptSettings = SettingsService.getReceipt()

      const data = { order, items, payment, business, receiptSettings }

      const lines = params.type === 'kitchen'
        ? ReceiptFormatter.formatKitchen(data)
        : ReceiptFormatter.formatCustomer(data)

      // Generate text preview (since no real printer available)
      const preview = this.formatPreview(lines)

      // Real printing would use node-thermal-printer here
      // For now, log and save to file
      logger.info({
        orderId: params.orderId,
        type: params.type,
        copies,
        isReprint: params.isReprint,
        lineCount: lines.length
      }, 'Receipt printed (preview mode)')

      AuditService.log(
        params.isReprint ? 'order.reprinted' : 'order.printed',
        { orderId: params.orderId, type: params.type, copies },
        userId
      )

      return { ok: true, copies, preview }
    } catch (err: any) {
      logger.error({ err, orderId: params.orderId, type: params.type }, 'Print failed')
      return { ok: false, error: err?.message || 'Print failed', copies: 0 }
    }
  }

  /**
   * Format receipt lines as readable text preview.
   */
  private static formatPreview(lines: any[]): string {
    const output: string[] = []
    const WIDTH = 42

    for (const line of lines) {
      if (line.type === 'text') {
        const text = line.text || ''
        if (line.align === 'center') {
          const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2))
          output.push(' '.repeat(pad) + text)
        } else {
          output.push(text)
        }
      } else if (line.type === 'columns') {
        const left = line.left || ''
        const right = line.right || ''
        const spaces = Math.max(1, WIDTH - left.length - right.length)
        output.push(left + ' '.repeat(spaces) + right)
      } else if (line.type === 'divider') {
        output.push('-'.repeat(WIDTH))
      } else if (line.type === 'feed') {
        for (let i = 0; i < (line.lines || 1); i++) output.push('')
      } else if (line.type === 'image') {
        output.push('[LOGO]')
      }
    }

    return output.join('\n')
  }

  /**
   * Test print.
   */
  static async testPrint(): Promise<{ ok: boolean; error?: string; preview?: string }> {
    try {
      const business = SettingsService.getBusiness()

      const lines = [
        { type: 'feed', lines: 2 },
        { type: 'text', text: business.name || 'NOUVO POS VANILLA', align: 'center', bold: true, size: 'large' },
        { type: 'feed', lines: 1 },
        { type: 'divider' },
        { type: 'text', text: 'PRINTER TEST', align: 'center', bold: true },
        { type: 'divider' },
        { type: 'text', text: 'This is a test print.', align: 'center' },
        { type: 'text', text: 'If you see this, your printer', align: 'center', size: 'small' },
        { type: 'text', text: 'is working correctly.', align: 'center', size: 'small' },
        { type: 'feed', lines: 1 },
        { type: 'text', text: `Date: ${new Date().toLocaleString()}`, align: 'center', size: 'small' },
        { type: 'feed', lines: 4 }
      ]

      const preview = this.formatPreview(lines)

      logger.info('Test print executed (preview mode)')
      return { ok: true, preview }
    } catch (err: any) {
      logger.error({ err }, 'Test print failed')
      return { ok: false, error: err?.message || 'Test print failed' }
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      const config = this.getConfig()
      if (!config.name && config.connection !== 'network') return false
      return true
    } catch {
      return false
    }
  }
}
