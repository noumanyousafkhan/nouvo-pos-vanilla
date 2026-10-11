import { logger } from '../utils/logger'
import { SettingsService } from '../settings/SettingsService'
import { OrderService } from '../orders/OrderService'
import { ReceiptFormatter } from './ReceiptFormatter'

// node-thermal-printer is CommonJS
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { printer: ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer')

export interface PrintConfig {
  enabled: boolean
  interface: string
  type: 'epson' | 'star'
  width_mm: number
  char_width: number
  cut_enabled: boolean
  beep_enabled: boolean
  open_drawer: boolean
}

export class PrinterService {
  // ═══════════════════════════════════════════════════════
  // CONFIG — auto-derive interface from connection + name
  // ═══════════════════════════════════════════════════════
  private static getConfig(): PrintConfig {
    const r = SettingsService.getReceipt()
    const name = String(SettingsService.get('printer.name') ?? '').trim()
    const connection = String(SettingsService.get('printer.connection') ?? 'usb').trim()
    const address = String(SettingsService.get('printer.address') ?? '').trim()
    const port = Number(SettingsService.get('printer.port') ?? 9100)

    // Auto-derive interface based on connection type
    let iface = 'printer:default'
    if (connection === 'network' && address) {
      iface = `tcp://${address}:${port}`
    } else if (connection === 'usb' && name) {
      iface = `printer:${name}`
    } else if (connection === 'serial' && address) {
      iface = address
    }

    // Allow explicit override via printer.interface setting
    const explicit = SettingsService.get('printer.interface')
    if (explicit && String(explicit).trim()) {
      iface = String(explicit).trim()
    }

    return {
      enabled: SettingsService.getBoolean('printer.enabled', false),
      interface: iface,
      type: (SettingsService.get('printer.type') as 'epson' | 'star') ?? 'epson',
      width_mm: Number(r.width_mm ?? 80),
      char_width: Number(r.char_width ?? 42),
      cut_enabled: SettingsService.getBoolean('printer.cut_enabled', true),
      beep_enabled: SettingsService.getBoolean('printer.beep_enabled', false),
      open_drawer: SettingsService.getBoolean('printer.open_drawer', false)
    }
  }

  private static createPrinter(config: PrintConfig): any | null {
    if (!config.enabled) return null
    try {
      const printer = new ThermalPrinter({
        type: config.type === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON,
        interface: config.interface,
        characterSet: CharacterSet.PC437_USA,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        width: config.char_width
      })
      return printer
    } catch (err) {
      logger.error({ err, config }, 'Failed to create printer instance')
      return null
    }
  }

  // ═══════════════════════════════════════════════════════
  // APPLY LINES → PRINTER (async for image support)
  // ═══════════════════════════════════════════════════════
  private static async applyLines(printer: any, lines: any[]): Promise<void> {
    for (const line of lines) {
      switch (line.type) {
        case 'text': {
          const text = String(line.text || '')
          if (line.align === 'center') {
            if (line.bold && line.size === 'large') {
              printer.alignCenter()
              printer.bold(true)
              printer.setTextSize(1, 1)
              printer.println(text)
              printer.setTextNormal()
              printer.bold(false)
            } else if (line.bold) {
              printer.alignCenter()
              printer.bold(true)
              printer.println(text)
              printer.bold(false)
            } else {
              printer.alignCenter()
              printer.println(text)
            }
          } else if (line.align === 'right') {
            printer.alignRight()
            printer.println(text)
          } else {
            printer.alignLeft()
            if (line.bold) {
              printer.bold(true)
              printer.println(text)
              printer.bold(false)
            } else {
              printer.println(text)
            }
          }
          break
        }
        case 'columns': {
          const left = String(line.left || '')
          const right = String(line.right || '')
          if (line.bold) printer.bold(true)
          printer.alignLeft()
          printer.leftRight(left, right)
          if (line.bold) printer.bold(false)
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
        case 'image': {
          const imgPath = String(line.path || '').trim()
          if (imgPath) {
            try {
              if (typeof printer.printImage === 'function') {
                printer.alignCenter()
                await printer.printImage(imgPath)
              } else {
                logger.warn({ imgPath }, 'printer.printImage not available — skipping image')
              }
            } catch (err) {
              logger.warn({ err, imgPath }, 'Image print failed — continuing')
            }
          }
          break
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // PREVIEW — returns text + structured lines
  // ═══════════════════════════════════════════════════════
  static async previewReceipt(
    params: { orderId: number; type: 'customer' | 'kitchen' }
  ): Promise<{ ok: boolean; error?: string; preview?: string; lines?: any[] }> {
    try {
      const { order, items, payment } = OrderService.getFullOrder(params.orderId)
      const business = SettingsService.getBusiness()
      const receiptSettings = SettingsService.getReceipt()
      const data = { order, items, payment, business, receiptSettings }
      const lines = params.type === 'kitchen'
        ? ReceiptFormatter.formatKitchen(data)
        : ReceiptFormatter.formatCustomer(data)
      const preview = this.formatPreview(lines)
      return { ok: true, preview, lines }
    } catch (err: any) {
      logger.error({ err, orderId: params.orderId }, 'Preview failed')
      return { ok: false, error: err?.message || 'Preview failed' }
    }
  }

  // ═══════════════════════════════════════════════════════
  // PRINT RECEIPT
  // ═══════════════════════════════════════════════════════
  static async printReceipt(
    params: { orderId: number; type: 'customer' | 'kitchen'; copies?: number; isReprint?: boolean },
    userId?: number
  ): Promise<{ ok: boolean; error?: string; copies: number; preview?: string; lines?: any[]; printed?: boolean }> {
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
            await this.applyLines(printer, lines)
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
        logger.warn('Printer not enabled — preview only')
      }

      return { ok: true, copies, preview, lines, printed }
    } catch (err: any) {
      logger.error({ err, orderId: params.orderId }, 'Print failed')
      return { ok: false, error: err?.message || 'Print failed', copies }
    }
  }

  // ═══════════════════════════════════════════════════════
  // FORMAT PREVIEW — text representation
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // TEST PRINT
  // ═══════════════════════════════════════════════════════
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
          await this.applyLines(printer, lines)
          if (config.cut_enabled) printer.cut()
          await printer.execute()
          printed = true
        } catch (printErr: any) {
          logger.error({ printErr }, 'Test print execution failed')
          return { ok: false, error: printErr?.message || 'Test print failed', preview, printed: false }
        }
      } else {
        return { ok: false, error: 'Printer not enabled or invalid interface', preview, printed: false }
      }
      return { ok: true, preview, printed }
    } catch (err: any) {
      logger.error({ err }, 'Test print failed')
      return { ok: false, error: err?.message || 'Test print failed' }
    }
  }

  // ═══════════════════════════════════════════════════════
  // IS AVAILABLE
  // ═══════════════════════════════════════════════════════
  static async isAvailable(): Promise<{ ok: boolean; available: boolean; interface?: string; error?: string }> {
    try {
      const config = this.getConfig()
      if (!config.enabled) {
        return { ok: true, available: false, error: 'Printer disabled in settings' }
      }
      return { ok: true, available: true, interface: config.interface }
    } catch (err: any) {
      logger.error({ err }, 'Printer availability check failed')
      return { ok: false, available: false, error: err?.message || 'Check failed' }
    }
  }
}
