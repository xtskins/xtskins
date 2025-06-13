import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  full_name: z.string(),
  avatar_url: z.string().url(),
  plan: z.enum(['Free', 'Pro']),
  created_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/)
    .transform((date) => date), // aceita o formato ISO 8601 que o Supabase usa
})

export type User = z.infer<typeof userSchema>

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}
