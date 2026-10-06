import { z } from 'zod'

export const BusinessSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  logo_path: z.string().max(500).optional().default(''),
  address: z.string().max(500).optional().default(''),
  phone_1: z.string().max(50).optional().default(''),
  phone_2: z.string().max(50).optional().default(''),
  email: z.string().max(100).optional().default(''),
  website: z.string().max(200).optional().default(''),
  slogan: z.string().max(200).optional().default(''),
  currency_symbol: z.string().min(1).max(10).default('Rs.'),
  currency_code: z.string().min(2).max(5).default('PKR'),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_label: z.string().min(1).max(20).default('Tax'),
  tax_inclusive: z.boolean().default(false)
})

export const ReceiptSettingsSchema = z.object({
  header_line_1: z.string().max(100).optional().default(''),
  header_line_2: z.string().max(100).optional().default(''),
  footer_line_1: z.string().max(100).optional().default('Thank you for visiting!'),
  footer_line_2: z.string().max(100).optional().default('Please come again'),
  show_logo: z.boolean().default(true),
  show_tax: z.boolean().default(true),
  show_customer: z.boolean().default(true),
  show_table: z.boolean().default(true),
  show_order_type: z.boolean().default(true),
  show_qr: z.boolean().default(false),
  copies_customer: z.number().int().min(0).max(5).default(1),
  copies_kitchen: z.number().int().min(0).max(5).default(1),
  kitchen_show_prices: z.boolean().default(false),
  width_mm: z.number().int().min(58).max(210).default(80),
  char_width: z.number().int().min(20).max(80).default(42)
})

export const PrinterSettingsSchema = z.object({
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

export const OrderSettingsSchema = z.object({
  delivery_charge_default: z.number().min(0).default(0),
  delivery_charge_enabled: z.boolean().default(true),
  order_types: z.array(z.enum(['dine_in', 'takeaway', 'delivery'])).min(1).default(['dine_in', 'takeaway', 'delivery']),
  default_order_type: z.enum(['dine_in', 'takeaway', 'delivery']).default('takeaway'),
  require_customer_for_delivery: z.boolean().default(true),
  require_table_for_dine_in: z.boolean().default(false),
  auto_print_on_checkout: z.boolean().default(true),
  invoice_prefix: z.string().min(1).max(10).default('INV'),
  order_prefix: z.string().min(1).max(10).default('ORD'),
  discount_enabled: z.boolean().default(true),
  discount_max_percent: z.number().min(0).max(100).default(100)
})

export const SystemSettingsSchema = z.object({
  backup_enabled: z.boolean().default(true),
  backup_retention_days: z.number().int().min(1).max(365).default(30),
  backup_time: z.string().regex(/^\d{2}:\d{2}$/).default('02:00'),
  update_channel: z.enum(['stable', 'beta']).default('stable'),
  auto_check_updates: z.boolean().default(true),
  auto_download_updates: z.boolean().default(false),
  language: z.string().min(2).max(5).default('en'),
  theme: z.enum(['light']).default('light'),
  date_format: z.enum(['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD']).default('DD-MM-YYYY'),
  time_format: z.enum(['12h', '24h']).default('12h'),
  audit_retention_days: z.number().int().min(0).max(3650).default(0)
})
