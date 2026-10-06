import { z } from 'zod'

export const PrintReceiptSchema = z.object({
  orderId: z.number().int().positive(),
  type: z.enum(['customer', 'kitchen']).default('customer'),
  copies: z.number().int().min(1).max(5).default(1),
  isReprint: z.boolean().default(false)
})

export const PrinterConfigSchema = z.object({
  name: z.string().max(200).optional().default(''),
  type: z.enum(['thermal', 'laser', 'pdf']).default('thermal'),
  connection: z.enum(['usb', 'network', 'serial']).default('usb'),
  address: z.string().max(200).optional().default(''),
  port: z.number().int().min(1).max(65535).default(9100),
  width_mm: z.number().int().min(58).max(210).default(80),
  cut_enabled: z.boolean().default(true),
  beep_enabled: z.boolean().default(false),
  open_drawer: z.boolean().default(false)
})
