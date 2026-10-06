import { z } from 'zod'

export const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  image_path: z.string().max(500).nullable().optional().default('')
})

export const CategoryUpdateSchema = CategorySchema.partial()

export const ProductSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(1000000),
  image_path: z.string().max(500).nullable().optional().default(''),
  is_active: z.boolean().default(true),
  has_variants: z.boolean().default(false),
  has_modifiers: z.boolean().default(false)
})

export const ProductUpdateSchema = ProductSchema.partial()

export const VariantSchema = z.object({
  product_id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  price_adjust: z.number().min(-1000000).max(1000000).default(0),
  is_default: z.boolean().default(false)
})

export const ModifierSchema = z.object({
  product_id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  is_required: z.boolean().default(false),
  is_multiple: z.boolean().default(true)
})

export const ModifierOptionSchema = z.object({
  modifier_id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(1000000).default(0),
  is_default: z.boolean().default(false)
})

export const FullProductSchema = z.object({
  product: ProductSchema,
  variants: z.array(VariantSchema.omit({ product_id: true })).default([]),
  modifiers: z.array(z.object({
    name: z.string().min(1).max(100),
    is_required: z.boolean().default(false),
    is_multiple: z.boolean().default(true),
    options: z.array(ModifierOptionSchema.omit({ modifier_id: true })).default([])
  })).default([])
})
