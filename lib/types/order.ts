import { z } from 'zod'

// Schema para item do pedido
export const orderItemSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  skin_id: z.string(),
  quantity: z.number().min(1).default(1),
  unit_price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  total_price: z
    .union([z.string(), z.number()])
    .transform((val) => String(val)),
  skin: z.object({
    id: z.string(),
    markethashname: z.string(),
    image: z.string(),
    wear: z.string(),
    discount_price: z.string(),
    price: z.string(),
    tradable: z.boolean(),
    isstattrak: z.boolean(),
    issouvenir: z.boolean(),
  }),
  created_at: z.string(),
})

// Schema para pedido
export const orderSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  total_amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val)),
  discount_amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val)),
  coupon_code: z.string().nullable(),
  coupon_discount_percent: z.number().nullable(),
  items: z.array(orderItemSchema),
  customer: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
})

// Schema para criação de pedido
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        skin_id: z.string(),
        quantity: z.number().min(1).default(1),
      }),
    )
    .min(1, 'Pelo menos um item é necessário'),
  coupon_code: z.string().optional(),
  recaptcha_token: z.string().min(1, 'Token reCAPTCHA é obrigatório'),
})

// Schema para atualização de status
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
})

export type Order = z.infer<typeof orderSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
  }
}
