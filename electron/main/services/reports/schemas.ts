import { z } from 'zod'

export const ReportFiltersSchema = z.object({
  range: z.enum(['today', 'week', 'month', 'year', 'all', 'custom']).default('today'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  includeVoided: z.boolean().default(false)
})

export const TopProductsFiltersSchema = ReportFiltersSchema.extend({
  limit: z.number().int().min(1).max(100).default(10)
})

export const RecentTransactionsFiltersSchema = ReportFiltersSchema.extend({
  limit: z.number().int().min(1).max(100).default(10)
})
