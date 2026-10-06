import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invokeSafe } from '@/utils/ipc'

export interface BusinessSettings {
  name: string
  logo_path: string
  address: string
  phone_1: string
  phone_2: string
  email: string
  website: string
  slogan: string
  currency_symbol: string
  currency_code: string
  tax_rate: number
  tax_label: string
  tax_inclusive: boolean
}

export interface ReceiptSettings {
  header_line_1: string
  header_line_2: string
  footer_line_1: string
  footer_line_2: string
  show_logo: boolean
  show_tax: boolean
  show_customer: boolean
  show_table: boolean
  show_order_type: boolean
  show_qr: boolean
  copies_customer: number
  copies_kitchen: number
  kitchen_show_prices: boolean
  width_mm: number
  char_width: number
}

export interface PrinterSettings {
  name: string
  type: string
  connection: string
  address: string
  port: number
  width_mm: number
  cut_enabled: boolean
  beep_enabled: boolean
  open_drawer: boolean
}

export interface OrderSettings {
  delivery_charge_default: number
  delivery_charge_enabled: boolean
  order_types: string[]
  default_order_type: string
  require_customer_for_delivery: boolean
  require_table_for_dine_in: boolean
  auto_print_on_checkout: boolean
  invoice_prefix: string
  order_prefix: string
  discount_enabled: boolean
  discount_max_percent: number
}

export interface SystemSettings {
  backup_enabled: boolean
  backup_retention_days: number
  backup_time: string
  update_channel: string
  auto_check_updates: boolean
  auto_download_updates: boolean
  language: string
  theme: string
  date_format: string
  time_format: string
  audit_retention_days: number
}

const DEFAULT_BUSINESS: BusinessSettings = {
  name: 'NOUVO POS Vanilla',
  logo_path: '',
  address: 'Mansehra KPK Pakistan',
  phone_1: '03114521220',
  phone_2: '',
  email: 'havenirnomi@gmail.com',
  website: '',
  slogan: 'NOUVO POS By: Nouman Khan',
  currency_symbol: 'Rs.',
  currency_code: 'PKR',
  tax_rate: 0,
  tax_label: 'Tax',
  tax_inclusive: false
}

const DEFAULT_RECEIPT: ReceiptSettings = {
  header_line_1: '',
  header_line_2: '',
  footer_line_1: 'Thank you for visiting!',
  footer_line_2: 'Please come again',
  show_logo: true,
  show_tax: true,
  show_customer: true,
  show_table: true,
  show_order_type: true,
  show_qr: false,
  copies_customer: 1,
  copies_kitchen: 1,
  kitchen_show_prices: false,
  width_mm: 80,
  char_width: 42
}

const DEFAULT_PRINTER: PrinterSettings = {
  name: '',
  type: 'thermal',
  connection: 'usb',
  address: '',
  port: 9100,
  width_mm: 80,
  cut_enabled: true,
  beep_enabled: false,
  open_drawer: false
}

const DEFAULT_ORDER: OrderSettings = {
  delivery_charge_default: 0,
  delivery_charge_enabled: true,
  order_types: ['dine_in', 'takeaway', 'delivery'],
  default_order_type: 'takeaway',
  require_customer_for_delivery: true,
  require_table_for_dine_in: false,
  auto_print_on_checkout: true,
  invoice_prefix: 'INV',
  order_prefix: 'ORD',
  discount_enabled: true,
  discount_max_percent: 100
}

const DEFAULT_SYSTEM: SystemSettings = {
  backup_enabled: true,
  backup_retention_days: 30,
  backup_time: '02:00',
  update_channel: 'stable',
  auto_check_updates: true,
  auto_download_updates: false,
  language: 'en',
  theme: 'light',
  date_format: 'DD-MM-YYYY',
  time_format: '12h',
  audit_retention_days: 0
}

export const useSettingsStore = defineStore('settings', () => {
  const business = ref<BusinessSettings>({ ...DEFAULT_BUSINESS })
  const receipt = ref<ReceiptSettings>({ ...DEFAULT_RECEIPT })
  const printer = ref<PrinterSettings>({ ...DEFAULT_PRINTER })
  const order = ref<OrderSettings>({ ...DEFAULT_ORDER })
  const system = ref<SystemSettings>({ ...DEFAULT_SYSTEM })

  const loading = ref(false)
  const loaded = ref(false)

  const currency = computed(() => business.value.currency_symbol || 'Rs.')
  const businessName = computed(() => business.value.name || 'NOUVO POS')
  const taxRate = computed(() => Number(business.value.tax_rate) || 0)
  const taxInclusive = computed(() => !!business.value.tax_inclusive)

  async function loadAll() {
    loading.value = true
    try {
      const [b, r, p, o, s] = await Promise.all([
        invokeSafe<any>('settings:getBusiness'),
        invokeSafe<any>('settings:getReceipt'),
        invokeSafe<any>('settings:getPrinter'),
        invokeSafe<any>('settings:getOrder'),
        invokeSafe<any>('settings:getSystem')
      ])
      if (b.ok && b.data) business.value = { ...DEFAULT_BUSINESS, ...b.data }
      if (r.ok && r.data) receipt.value = { ...DEFAULT_RECEIPT, ...r.data }
      if (p.ok && p.data) printer.value = { ...DEFAULT_PRINTER, ...p.data }
      if (o.ok && o.data) order.value = { ...DEFAULT_ORDER, ...o.data }
      if (s.ok && s.data) system.value = { ...DEFAULT_SYSTEM, ...s.data }
      loaded.value = true
      console.log('[settings-store] loaded:', business.value.name, business.value.currency_symbol)
    } catch (err) {
      console.error('[settings-store] load failed', err)
    } finally {
      loading.value = false
    }
  }

  async function updateBusiness(data: Partial<BusinessSettings>) {
    const res = await invokeSafe('settings:updateBusiness', data)
    if (res.ok) business.value = { ...business.value, ...data } as BusinessSettings
    return res
  }

  async function updateReceipt(data: Partial<ReceiptSettings>) {
    const res = await invokeSafe('settings:updateReceipt', data)
    if (res.ok) receipt.value = { ...receipt.value, ...data } as ReceiptSettings
    return res
  }

  async function updatePrinter(data: Partial<PrinterSettings>) {
    const res = await invokeSafe('settings:updatePrinter', data)
    if (res.ok) printer.value = { ...printer.value, ...data } as PrinterSettings
    return res
  }

  async function updateOrder(data: Partial<OrderSettings>) {
    const res = await invokeSafe('settings:updateOrder', data)
    if (res.ok) order.value = { ...order.value, ...data } as OrderSettings
    return res
  }

  async function updateSystem(data: Partial<SystemSettings>) {
    const res = await invokeSafe('settings:updateSystem', data)
    if (res.ok) system.value = { ...system.value, ...data } as SystemSettings
    return res
  }

  function reset() {
    business.value = { ...DEFAULT_BUSINESS }
    receipt.value = { ...DEFAULT_RECEIPT }
    printer.value = { ...DEFAULT_PRINTER }
    order.value = { ...DEFAULT_ORDER }
    system.value = { ...DEFAULT_SYSTEM }
    loaded.value = false
  }

  return {
    business, receipt, printer, order, system,
    loading, loaded,
    currency, businessName, taxRate, taxInclusive,
    loadAll, updateBusiness, updateReceipt, updatePrinter, updateOrder, updateSystem,
    reset
  }
})
