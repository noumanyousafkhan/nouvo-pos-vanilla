import { z } from 'zod'

export const OrderHistoryFiltersSchema = z.object({
  search: z.string().max(100).optional().default(''),
  range: z.enum(['today', 'week', 'month', 'year', 'all', 'custom']).default('today'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  status: z.enum(['completed', 'voided']).optional().default('completed'),
  includeVoided: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'total', 'order_number']).default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
})

export const VoidOrderSchema = z.object({
  orderId: z.number().int().positive(),
  reason: z.string().min(3).max(500)
})
