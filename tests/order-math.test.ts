import { describe, expect, it } from 'vitest'
import { validateOrderTotals } from '../electron/main/services/orders/orderMath'

const base = {
  items: [{ unitPrice: 100, quantity: 2, lineTotal: 200 }],
  subtotal: 200,
  discount: 0,
  deliveryCharge: 0,
  tax: 0,
  total: 200,
  taxInclusive: false
}

describe('checkout total calculations', () => {
  it('accepts a valid tax-exclusive order', () => {
    expect(validateOrderTotals({ ...base, tax: 30, total: 230 })).toBeNull()
  })

  it('does not add tax twice when prices already include tax', () => {
    expect(validateOrderTotals({ ...base, tax: 17.39, total: 200, taxInclusive: true })).toBeNull()
  })

  it('rejects a tampered line total', () => {
    expect(validateOrderTotals({ ...base, items: [{ unitPrice: 100, quantity: 2, lineTotal: 1 }] })).toBe('line_total')
  })

  it('rejects a subtotal that does not match cart lines', () => {
    expect(validateOrderTotals({ ...base, subtotal: 201 })).toBe('subtotal')
  })

  it('rejects a mismatched final total', () => {
    expect(validateOrderTotals({ ...base, total: 199 })).toBe('total')
  })
})
