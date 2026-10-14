import { describe, expect, it } from 'vitest'
import { CategorySchema, ProductSchema, FullProductSchema } from '../electron/main/services/menu/schemas'
import { CreateOrderSchema } from '../electron/main/services/orders/schemas'
import { ReceiptFormatter } from '../electron/main/services/printing/ReceiptFormatter'
import { RoleService } from '../electron/main/services/auth/RoleService'

describe('menu input validation', () => {
  it('rejects empty category names', () => {
    expect(CategorySchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects negative product prices and invalid category IDs', () => {
    expect(ProductSchema.safeParse({ category_id: 1, name: 'Tea', price: -1 }).success).toBe(false)
    expect(ProductSchema.safeParse({ category_id: 0, name: 'Tea', price: 10 }).success).toBe(false)
  })

  it('applies safe defaults to full product variants and modifiers', () => {
    const parsed = FullProductSchema.safeParse({
      product: { category_id: 1, name: 'Tea', price: 100 }
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.variants).toEqual([])
      expect(parsed.data.modifiers).toEqual([])
    }
  })
})

describe('checkout input validation', () => {
  const validOrder = {
    orderType: 'takeaway',
    items: [{
      productId: 1, productName: 'Tea', variantId: null, basePrice: 100,
      variantAdjust: 0, modifiers: [], dealChildren: [], quantity: 1,
      unitPrice: 100, lineTotal: 100
    }],
    subtotal: 100, discount: 0, deliveryCharge: 0, tax: 0, total: 100,
    paymentMethod: 'cash', amountReceived: 100, idempotencyKey: 'order-key-123'
  }

  it('accepts a valid checkout payload', () => {
    expect(CreateOrderSchema.safeParse(validOrder).success).toBe(true)
  })

  it('rejects an empty cart and missing idempotency key', () => {
    expect(CreateOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false)
    const { idempotencyKey: _key, ...withoutKey } = validOrder
    expect(CreateOrderSchema.safeParse(withoutKey).success).toBe(false)
  })
})

describe('receipt formatting', () => {
  it('formats supported order types consistently', () => {
    expect(ReceiptFormatter.formatOrderType('dine_in')).toBe('Dine-In')
    expect(ReceiptFormatter.formatOrderType('takeaway')).toBe('Takeaway')
    expect(ReceiptFormatter.formatOrderType('delivery')).toBe('Delivery')
  })

  it('wraps long item names without dropping text', () => {
    const name = 'Extra Large Chicken Supreme Pizza With Cheese'
    const wrapped = (ReceiptFormatter as any).wrapText(name, 12) as string[]
    expect(wrapped.join(' ')).toBe(name)
    expect(wrapped.every((line) => line.length <= 12)).toBe(true)
  })
})

describe('role-based permission policy', () => {
  it('allows cashiers to use POS but not void completed orders', () => {
    expect(RoleService.hasPermission('cashier', 'pos.use')).toBe(true)
    expect(RoleService.hasPermission('cashier', 'orders.void')).toBe(false)
  })

  it('restricts backup restore and software updates to super admins', () => {
    expect(RoleService.hasPermission('admin', 'backup.restore')).toBe(false)
    expect(RoleService.hasPermission('admin', 'system.update')).toBe(false)
    expect(RoleService.hasPermission('super_admin', 'backup.restore')).toBe(true)
    expect(RoleService.hasPermission('super_admin', 'system.update')).toBe(true)
  })
})
