import { handle } from './index'
import { PrinterService } from '../services/printing/PrinterService'
import { PrintReceiptSchema } from '../services/printing/schemas'

export function registerPrintingIpc(): void {
  handle('print:preview', async (data) => {
    const parsed = PrintReceiptSchema.parse(data)
    return PrinterService.previewReceipt(parsed)
  })

  handle('print:receipt', async (data, userId) => {
    const parsed = PrintReceiptSchema.parse(data)
    return PrinterService.printReceipt(parsed, userId)
  })

  handle('print:test', () => PrinterService.testPrint())
  handle('print:isAvailable', () => PrinterService.isAvailable())
}
