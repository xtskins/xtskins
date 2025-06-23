import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/lib/types/order'
import { z } from 'zod'

const validateCouponSchema = z.object({
  couponCode: z.string().min(1, 'Código do cupom é obrigatório'),
  orderAmount: z.number().optional().default(0), // Valor do pedido para validação
})

interface CouponValidationResult {
  is_valid: boolean
  coupon_id: string | null
  discount_type: 'percentage' | 'fixed_amount' | null
  discount_value: number | null
  max_discount: number | null
  error_message: string | null
}

// POST - Validar cupom
export async function POST(req: Request): Promise<Response> {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Token de acesso é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const { couponCode, orderAmount } = validateCouponSchema.parse(body)

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Usuário não autenticado',
            code: 'UNAUTHORIZED',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Usar service role para acessar a função de validação
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Validar cupom usando a função do banco de dados
    const { data: validationResult, error: validationError } =
      (await supabaseAdmin
        .rpc('validate_coupon', {
          p_coupon_code: couponCode,
          p_user_id: userData.user.id,
          p_order_amount: orderAmount,
        })
        .single()) as {
        data: CouponValidationResult | null
        error: Error | null
      }

    if (validationError || !validationResult) {
      console.error('Erro ao validar cupom:', validationError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao validar cupom',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se o cupom é válido
    if (!validationResult.is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: validationResult.error_message || 'Cupom inválido',
            code: 'INVALID_COUPON',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Calcular o desconto baseado no tipo
    let discountAmount = 0
    if (
      validationResult.discount_type === 'percentage' &&
      validationResult.discount_value
    ) {
      discountAmount = (orderAmount * validationResult.discount_value) / 100
      // Aplicar limite máximo se existir
      if (
        validationResult.max_discount &&
        discountAmount > validationResult.max_discount
      ) {
        discountAmount = validationResult.max_discount
      }
    } else if (
      validationResult.discount_type === 'fixed_amount' &&
      validationResult.discount_value
    ) {
      discountAmount = validationResult.discount_value
    }

    const result: ApiResponse<{
      coupon_id: string
      discount_type: string
      discount_value: number
      discount_amount: number
      max_discount?: number
    }> = {
      success: true,
      data: {
        coupon_id: validationResult.coupon_id || '',
        discount_type: validationResult.discount_type || 'percentage',
        discount_value: validationResult.discount_value || 0,
        discount_amount: discountAmount,
        max_discount: validationResult.max_discount || undefined,
      },
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao validar cupom:', error)

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
