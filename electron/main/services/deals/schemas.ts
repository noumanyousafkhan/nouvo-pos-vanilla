import { z } from 'zod'

export const DealItemSchema = z.object({
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1).max(100).default(1)
})

export const DealSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(1000000),
  image_path: z.string().max(500).optional().default(''),
  is_active: z.boolean().default(true),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
  items: z.array(DealItemSchema).min(1, 'Deal must have at least one item')
})

export const DealUpdateSchema = DealSchema.partial().omit({ items: true })
