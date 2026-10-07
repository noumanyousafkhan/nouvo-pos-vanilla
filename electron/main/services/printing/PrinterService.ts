import { SettingsService } from '../settings/SettingsService'
import { OrderService } from '../orders/OrderService'
import { AuditService } from '../audit/AuditService'
import { ReceiptFormatter } from './ReceiptFormatter'
import { logger } from '../utils/logger'

/* eslint-disable @typescript-eslint/no-var-requires */
let ThermalPrinter: any = null
let PrinterTypes: any = null
try {
  const mod = require('node-thermal-printer')
  ThermalPrinter = mod.printer
  PrinterTypes = mod.types || mod.PrinterTypes
} catch {
  logger.warn('node-thermal-printer not installed — using preview mode only')
}

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

  private static buildInterface(config: any): string | null {
    if (config.connection === 'network' && config.address) {
      return `tcp://${config.address}:${config.port}`
    }
    if (config.connection === 'serial' && config.address) {
      return `serial:${config.address}`
    }
    if (config.connection === 'usb' && config.name) {
      return `printer:${config.name}`
    }
    return null
  }

  private static createPrinter(config: any): any | null {
    if (!ThermalPrinter) return null
    const iface = this.buildInterface(config)
    if (!iface) return null
    try {
      return new ThermalPrinter({
        type: PrinterTypes?.EPSON || 'epson',
        interface: iface,
        width: config.width_mm === 58 ? 32 : 42,
        characterSet: 'PC437',
        removeSpecialCharacters: false,
        lineCharacter: '-'
      })
    } catch (err) {
      logger.error({ err, iface }, 'Failed to create ThermalPrinter')
      return null
    }
  }

  private static applyLines(printer: any, lines: any[]): void {
    for (const line of lines) {
      switch (line.type) {
        case 'text': {
          if (line.align === 'center') printer.alignCenter()
          else if (line.align === 'right') printer.alignRight()
          else printer.alignLeft()

          if (line.bold) printer.bold(true)
          if (line.size === 'large') printer.setTextSize(1, 1)
          else if (line.size === 'small') printer.setTextSize(0, 0)

          printer.println(String(line.text ?? ''))

          printer.bold(false)
          printer.setTextSize(0, 0)
          printer.alignLeft()
          break
        }
        case 'columns': {
          printer.alignLeft()
          if (line.bold) printer.bold(true)
          if (line.size === 'large') printer.setTextSize(1, 1)
          const left = String(line.left ?? '')
          const right = String(line.right ?? '')
          const width = 42
          const spaces = Math.max(1, width - left.length - right.length)
          printer.println(left + ' '.repeat(spaces) + right)
          printer.bold(false)
          printer.setTextSize(0, 0)
          break
        }
        case 'divider':
          printer.drawLine()
          break
        case 'feed': {
          const n = line.lines || 1
          for (let i = 0; i < n; i++) printer.newLine()
          break
        }
        case 'image':
          break
      }
    }
  }

  /**
   * Preview only — generate text, no printing.
   */
  static async previewReceipt(
    params: { orderId: number; type: 'customer' | 'kitchen' }
  ): Promise<{ ok: boolean; error?: string; preview?: string }> {
    try {
      const { order, items, payment } = OrderService.getFullOrder(params.orderId)
      const business = SettingsService.getBusiness()
      const receiptSettings = SettingsService.getReceipt()
      const data = { order, items, payment, business, receiptSettings }
      const lines = params.type === 'kitchen'
        ? ReceiptFormatter.formatKitchen(data)
        : ReceiptFormatter.formatCustomer(data)
      const preview = this.formatPreview(lines)
      return { ok: true, preview }
    } catch (err: any) {
      logger.error({ err, orderId: params.orderId }, 'Preview failed')
      return { ok: false, error: err?.message || 'Preview failed' }
    }
  }

  /**
   * Actual print — sends to printer if available.
   */
  static async printReceipt(
    params: { orderId: number; type: 'customer' | 'kitchen'; copies?: number; isReprint?: boolean },
    userId?: number
  ): Promise<{ ok: boolean; error?: string; copies: number; preview?: string; printed?: boolean }> {
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
      const preview = this.formatPreview(lines)

      const config = this.getConfig()
      const printer = this.createPrinter(config)
      let printed = false

      if (printer) {
        try {
          for (let c = 0; c < copies; c++) {
            this.applyLines(printer, lines)
            if (config.cut_enabled) printer.cut()
          }
          if (config.beep_enabled) printer.beep()
          if (config.open_drawer) printer.openCashDrawer()
          await printer.execute()
          printed = true
          logger.info({ orderId: params.orderId, type: params.type, copies }, 'Receipt sent to printer')
        } catch (printErr: any) {
          logger.error({ printErr, config }, 'Printer execution failed — preview only')
        }
      } else {
        logger.info({ orderId: params.orderId, type: params.type }, 'Printer not configured — preview mode')
      }

      AuditService.log(
        params.isReprint ? 'order.reprinted' : 'order.printed',
        { orderId: params.orderId, type: params.type, copies, printed },
        userId
      )

      return { ok: true, copies, preview, printed }
    } catch (err: any) {
      logger.error({ err, orderId: params.orderId, type: params.type }, 'Print failed')
      return { ok: false, error: err?.message || 'Print failed', copies: 0 }
    }
  }

  private static formatPreview(lines: any[]): string {
    const output: string[] = []
    const WIDTH = 42
    for (const line of lines) {
      if (line.type === 'text') {
        const text = String(line.text || '')
        if (line.align === 'center') {
          const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2))
          output.push(' '.repeat(pad) + text)
        } else {
          output.push(text)
        }
      } else if (line.type === 'columns') {
        const left = String(line.left || '')
        const right = String(line.right || '')
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

  static async testPrint(): Promise<{ ok: boolean; error?: string; preview?: string; printed?: boolean }> {
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
        { type: 'feed', lines: 1 },
        { type: 'text', text: `Date: ${new Date().toLocaleString()}`, align: 'center', size: 'small' },
        { type: 'feed', lines: 4 }
      ]
      const preview = this.formatPreview(lines)
      const config = this.getConfig()
      const printer = this.createPrinter(config)
      let printed = false
      if (printer) {
        try {
          this.applyLines(printer, lines)
          if (config.cut_enabled) printer.cut()
          await printer.execute()
          printed = true
        } catch (printErr: any) {
          logger.error({ printErr }, 'Test print execution failed')
        }
      }
      return { ok: true, preview, printed }
    } catch (err: any) {
      logger.error({ err }, 'Test print failed')
      return { ok: false, error: err?.message || 'Test print failed' }
    }
  }

  static async isAvailable(): Promise<boolean> {
    try {
      const config = this.getConfig()
      if (!config.name && config.connection !== 'network' && config.connection !== 'serial') return false
      const printer = this.createPrinter(config)
      if (!printer) return false
      return await printer.isPrinterConnected()
    } catch {
      return false
    }
  }
}
