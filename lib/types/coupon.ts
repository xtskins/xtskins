import { z } from 'zod'

// Enum types
export type CouponType = 'percentage' | 'fixed_amount'
export type CouponStatus = 'active' | 'inactive' | 'expired'

// Schema para cupom
export const couponSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number(),
  max_discount_amount: z.number().nullable(),
  min_order_amount: z.number(),
  usage_limit: z.number().nullable(),
  used_count: z.number(),
  usage_limit_per_user: z.number(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'expired']),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by_user: z
    .object({
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
})

// Schema para criação de cupom
export const createCouponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(50, 'Código muito longo'),
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount'], {
    required_error: 'Tipo é obrigatório',
  }),
  value: z.number().positive('Valor deve ser positivo'),
  max_discount_amount: z.number().positive().optional(),
  min_order_amount: z
    .number()
    .min(0, 'Valor mínimo não pode ser negativo')
    .default(0),
  usage_limit: z.number().positive().optional(),
  usage_limit_per_user: z.number().positive().default(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

// Schema para atualização de cupom
export const updateCouponSchema = createCouponSchema.partial()

// Tipos TypeScript
export type Coupon = z.infer<typeof couponSchema>
export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>

// Interface para resposta da API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: unknown
  }
  message?: string
}

// Interface para estatísticas de cupons
export interface CouponStats {
  total_coupons: number
  active_coupons: number
  inactive_coupons: number
  expired_coupons: number
  total_usage: number
  total_discount_given: number
}
