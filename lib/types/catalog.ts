import { z } from 'zod'

export const catalogItemRowSchema = z.object({
  id: z.string(),
  markethashname: z.string(),
  marketname: z.string(),
  image: z.string(),
  wear: z.string(),
  type: z.string().nullable(),
  sub_type: z.string().nullable(),
  list_price: z.union([z.string(), z.number()]),
  discount_price: z.union([z.string(), z.number(), z.null()]),
  reference_price_steam: z.union([z.string(), z.number(), z.null()]).optional(),
  is_visible: z.boolean(),
  sort_order: z.number(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const createCatalogItemSchema = z.object({
  markethashname: z.string().min(1),
  marketname: z.string().min(1),
  image: z.string().min(1),
  wear: z.string().default(''),
  type: z.string().optional().nullable(),
  sub_type: z.string().optional().nullable(),
  list_price: z.number().nonnegative(),
  discount_price: z.number().nonnegative().optional().nullable(),
  reference_price_steam: z.number().nonnegative().optional().nullable(),
  is_visible: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  notes: z.string().optional().nullable(),
})

export const updateCatalogItemSchema = createCatalogItemSchema.partial()

export type CatalogItemRow = z.infer<typeof catalogItemRowSchema>
export type CreateCatalogItemInput = z.infer<typeof createCatalogItemSchema>
export type UpdateCatalogItemInput = z.infer<typeof updateCatalogItemSchema>
