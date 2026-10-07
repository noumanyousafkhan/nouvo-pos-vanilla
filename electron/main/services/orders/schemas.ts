import { z } from 'zod'

export const OrderItemModifierSchema = z.object({
  modifierId: z.number().int().positive().nullable().optional(),
  modifierName: z.string().min(1).max(100),
  optionId: z.number().int().positive().nullable().optional(),
  optionName: z.string().min(1).max(100),
  price: z.number().min(0).max(1000000)
})

export const FlavourSelectionSchema = z.object({
  flavourProductId: z.number().int().positive(),
  flavourName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(100)
})

export const DealChildItemSchema = z.object({
  productId: z.number().int().positive().nullable().optional(),
  productName: z.string().min(1).max(200),
  variantName: z.string().max(100).nullable().optional(),
  quantity: z.number().int().min(1).max(1000),
  modifiers: z.array(OrderItemModifierSchema).default([]),
  selectedFlavours: z.array(FlavourSelectionSchema).default([])
})

export const OrderItemSchema = z.object({
  productId: z.number().int().positive().nullable(),
  productName: z.string().min(1).max(200),
  variantId: z.number().int().positive().nullable().optional(),
  variantName: z.string().max(100).nullable().optional(),
  basePrice: z.number().min(0).max(1000000),
  variantAdjust: z.number().min(-1000000).max(1000000).default(0),
  modifiers: z.array(OrderItemModifierSchema).default([]),
  dealChildren: z.array(DealChildItemSchema).default([]),   // ⭐ ADDED
  quantity: z.number().int().min(1).max(1000),
  unitPrice: z.number().min(0).max(1000000),
  lineTotal: z.number().min(0).max(100000000),
  notes: z.string().max(2000).optional().default(''),
  dealId: z.number().int().positive().nullable().optional(),
  dealName: z.string().max(200).nullable().optional()
})

export const CreateOrderSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  customerName: z.string().max(100).optional().default(''),
  customerPhone: z.string().max(30).optional().default(''),
  customerAddress: z.string().max(500).optional().default(''),
  tableNumber: z.string().max(20).optional().default(''),
  items: z.array(OrderItemSchema).min(1, 'Cart cannot be empty'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  deliveryCharge: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  paymentMethod: z.enum(['cash', 'card']),
  amountReceived: z.number().min(0).default(0),
  notes: z.string().max(500).optional().default(''),
  idempotencyKey: z.string().min(8).max(100)
})

export const OrderFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0)
})
