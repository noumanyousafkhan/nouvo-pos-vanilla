import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartModifier {
  modifierId: number
  modifierName: string
  optionId: number
  optionName: string
  price: number
}

export interface FlavourSelection {
  flavourProductId: number
  flavourName: string
  quantity: number
}

export interface DealChildItem {
  productId: number
  productName: string
  variantName: string | null
  quantity: number
  modifiers?: CartModifier[]
  selectedFlavours?: FlavourSelection[]
}

export interface CartItem {
  id: string
  type: 'product' | 'deal'
  productId: number | null
  productName: string
  image_path: string | null
  variantId: number | null
  variantName: string | null
  basePrice: number
  variantAdjust: number
  modifiers: CartModifier[]
  modifiersTotal: number
  quantity: number
  unitPrice: number
  lineTotal: number
  notes: string
  dealId: number | null
  dealName: string | null
  dealItems: DealChildItem[]
  dealPrice: number | null
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const orderType = ref<'dine_in' | 'takeaway' | 'delivery'>('takeaway')
  const customerName = ref('')
  const customerPhone = ref('')
  const customerAddress = ref('')
  const tableNumber = ref('')
  const discount = ref<number | null>(null)
  const deliveryCharge = ref<number | null>(null)
  const notes = ref('')

  const taxRate = ref(0)
  const taxInclusive = ref(false)
  const currency = ref('Rs.')

  const itemCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.lineTotal, 0))
  const discountValue = computed(() => discount.value ?? 0)
  const deliveryValue = computed(() => deliveryCharge.value ?? 0)
  const taxableAmount = computed(() => Math.max(0, subtotal.value - discountValue.value))

  const taxAmount = computed(() => {
    if (taxRate.value <= 0) return 0
    if (taxInclusive.value) {
      return taxableAmount.value - taxableAmount.value / (1 + taxRate.value / 100)
    }
    return taxableAmount.value * (taxRate.value / 100)
  })

  const total = computed(() => {
    if (taxInclusive.value) return taxableAmount.value + deliveryValue.value
    return taxableAmount.value + taxAmount.value + deliveryValue.value
  })

  const isEmpty = computed(() => items.value.length === 0)

  function generateLineId(): string {
    return `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function buildSignature(item: Omit<CartItem, 'id' | 'lineTotal'>): string {
    const mods = [...item.modifiers]
      .sort((a, b) => a.optionId - b.optionId)
      .map((m) => `${m.modifierId}:${m.optionId}`)
      .join(',')
    return [item.productId, item.variantId ?? 'none', mods, item.notes.trim()].join('|')
  }

  function addItem(newItem: Omit<CartItem, 'id' | 'lineTotal'>) {
    const signature = buildSignature(newItem)
    const existing = items.value.find(
      (i) => i.type === 'product' && buildSignature(i) === signature
    )
    if (existing) {
      existing.quantity += newItem.quantity
      existing.lineTotal = existing.unitPrice * existing.quantity
      return existing
    }
    const lineTotal = newItem.unitPrice * newItem.quantity
    const item: CartItem = { ...newItem, id: generateLineId(), lineTotal }
    items.value.push(item)
    return item
  }

  function addProduct(product: any, options?: {
    variant?: any
    modifiers?: CartModifier[]
    quantity?: number
    notes?: string
  }) {
    const variant = options?.variant ?? null
    const modifiers = options?.modifiers ?? []
    const quantity = options?.quantity ?? 1
    const variantAdjust = variant?.price_adjust ?? 0
    const modifiersTotal = modifiers.reduce((s, m) => s + m.price, 0)
    const unitPrice = product.price + variantAdjust + modifiersTotal

    return addItem({
      type: 'product',
      productId: product.id,
      productName: product.name,
      image_path: product.image_path ?? null,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      basePrice: product.price,
      variantAdjust,
      modifiers,
      modifiersTotal,
      quantity,
      unitPrice,
      notes: options?.notes ?? '',
      dealId: null,
      dealName: null,
      dealItems: [],
      dealPrice: null
    })
  }

  /**
   * Add a deal with customization (flavours + modifiers) as a single line.
   * Payload from DealCustomizationModal.
   */
  function addCustomizedDeal(payload: {
    deal: any
    items: any[]
    dealPrice: number
    modifiersTotal: number
    grandTotal: number
  }) {
    const lineId = generateLineId()

    // Keep children AS-IS with flavours + modifiers preserved
    const dealItems: DealChildItem[] = payload.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      variantName: i.variantName || null,
      quantity: i.quantity,
      modifiers: i.modifiers || [],
      selectedFlavours: i.selectedFlavours || []
    }))

    const dealLine: CartItem = {
      id: lineId,
      type: 'deal',
      productId: null,
      productName: payload.deal.name,
      image_path: payload.deal.image_path ?? null,
      variantId: null,
      variantName: null,
      basePrice: payload.dealPrice,
      variantAdjust: 0,
      modifiers: [],
      modifiersTotal: payload.modifiersTotal,
      quantity: 1,
      unitPrice: payload.grandTotal,
      lineTotal: payload.grandTotal,
      notes: '',
      dealId: payload.deal.id,
      dealName: payload.deal.name,
      dealItems,
      dealPrice: payload.dealPrice
    }

    items.value.push(dealLine)
    return dealLine
  }

  function incrementQty(lineId: string) {
    const item = items.value.find((i) => i.id === lineId)
    if (!item || item.type === 'deal') return
    item.quantity += 1
    item.lineTotal = item.unitPrice * item.quantity
  }

  function decrementQty(lineId: string) {
    const item = items.value.find((i) => i.id === lineId)
    if (!item || item.type === 'deal') return
    if (item.quantity <= 1) return removeItem(lineId)
    item.quantity -= 1
    item.lineTotal = item.unitPrice * item.quantity
  }

  function removeItem(lineId: string) {
    items.value = items.value.filter((i) => i.id !== lineId)
  }

  function clearCart() {
    items.value = []
    discount.value = null
    deliveryCharge.value = null
    customerName.value = ''
    customerPhone.value = ''
    customerAddress.value = ''
    tableNumber.value = ''
    notes.value = ''
  }

  function setOrderType(type: 'dine_in' | 'takeaway' | 'delivery') {
    orderType.value = type
  }

  function setDiscount(value: number | null) {
    if (value === null || value === undefined || value === 0) discount.value = null
    else discount.value = Math.max(0, Math.min(value, subtotal.value))
  }

  function setDeliveryCharge(value: number | null) {
    if (value === null || value === undefined || value === 0) deliveryCharge.value = null
    else deliveryCharge.value = Math.max(0, value)
  }

  function loadSettings(s: { taxRate: number; taxInclusive: boolean; currency: string }) {
    taxRate.value = s.taxRate
    taxInclusive.value = s.taxInclusive
    currency.value = s.currency
  }

  /**
   * Export for checkout.
   *
   * IMPORTANT: Deal line is sent as ONE item with a `dealChildren` array
   * (structured). It is NOT flattened into modifiers.
   * The ReceiptFormatter will handle printing children properly.
   */
  function exportForCheckout() {
    const plainItems: any[] = []

    for (const i of items.value) {
      if (i.type === 'deal') {
        // Deal line — send children as a structured array
        const dealChildren = (i.dealItems || []).map((child) => ({
          productId: child.productId,
          productName: child.productName,
          variantName: child.variantName,
          quantity: child.quantity,
          modifiers: (child.modifiers || []).map((m) => ({
            modifierId: m.modifierId ?? null,
            modifierName: String(m.modifierName || ''),
            optionId: m.optionId ?? null,
            optionName: String(m.optionName || ''),
            price: Number(m.price) || 0
          })),
          selectedFlavours: (child.selectedFlavours || []).map((f) => ({
            flavourProductId: f.flavourProductId,
            flavourName: f.flavourName,
            quantity: f.quantity
          }))
        }))

        plainItems.push({
          productId: null,
          productName: i.productName,
          variantId: null,
          variantName: null,
          basePrice: i.dealPrice || 0,
          variantAdjust: 0,
          modifiers: [],           // ⚠️ Empty on purpose — children are inside dealChildren
          dealChildren,             // ← Structured children
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          notes: '',
          dealId: i.dealId,
          dealName: i.dealName
        })
      } else {
        plainItems.push({
          productId: i.productId,
          productName: i.productName,
          variantId: i.variantId,
          variantName: i.variantName,
          basePrice: i.basePrice,
          variantAdjust: i.variantAdjust,
          modifiers: (i.modifiers || []).map((m) => ({
            modifierId: m.modifierId ?? null,
            modifierName: String(m.modifierName || ''),
            optionId: m.optionId ?? null,
            optionName: String(m.optionName || ''),
            price: Number(m.price) || 0
          })),
          dealChildren: [],
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          notes: i.notes,
          dealId: null,
          dealName: null
        })
      }
    }

    return {
      items: plainItems,
      orderType: orderType.value,
      customerName: String(customerName.value || ''),
      customerPhone: String(customerPhone.value || ''),
      customerAddress: String(customerAddress.value || ''),
      tableNumber: String(tableNumber.value || ''),
      discount: Number(discountValue.value) || 0,
      deliveryCharge: Number(deliveryValue.value) || 0,
      subtotal: Number(subtotal.value) || 0,
      taxAmount: Number(taxAmount.value) || 0,
      total: Number(total.value) || 0,
      notes: String(notes.value || '')
    }
  }

  return {
    items, orderType, customerName, customerPhone, customerAddress,
    tableNumber, discount, deliveryCharge, notes,
    taxRate, taxInclusive, currency,
    itemCount, subtotal, discountValue, deliveryValue,
    taxAmount, total, isEmpty,
    addProduct, addCustomizedDeal, addItem,
    incrementQty, decrementQty, removeItem, clearCart,
    setOrderType, setDiscount, setDeliveryCharge, loadSettings,
    exportForCheckout
  }
})
