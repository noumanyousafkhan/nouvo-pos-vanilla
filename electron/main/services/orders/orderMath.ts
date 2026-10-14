export type OrderTotalsIssue = 'line_total' | 'subtotal' | 'total' | null

export function validateOrderTotals(input: {
  items: Array<{ unitPrice: number; quantity: number; lineTotal: number }>
  subtotal: number
  discount: number
  deliveryCharge: number
  tax: number
  total: number
  taxInclusive: boolean
}): OrderTotalsIssue {
  let itemsSubtotal = 0
  for (const item of input.items) {
    if (Math.abs(item.unitPrice * item.quantity - item.lineTotal) > 0.01) return 'line_total'
    itemsSubtotal += item.lineTotal
  }
  if (Math.abs(itemsSubtotal - input.subtotal) > 0.01) return 'subtotal'
  const expected = input.subtotal - input.discount + input.deliveryCharge +
    (input.taxInclusive ? 0 : input.tax)
  if (Math.abs(expected - input.total) > 0.01) return 'total'
  return null
}
