import { z } from 'zod'

export const ExportFiltersSchema = z.object({
  range: z.enum(['today', 'week', 'month', 'year', 'all', 'custom']).default('today'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  status: z.enum(['completed', 'voided']).optional(),
  includeVoided: z.boolean().default(false),
  categoryId: z.number().int().positive().optional(),
  includeInactive: z.boolean().default(false)
})
