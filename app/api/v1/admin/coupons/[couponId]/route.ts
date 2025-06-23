import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { updateCouponSchema } from '@/lib/types/coupon'
import { z } from 'zod'

async function checkAdminAccess(req: Request) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return {
      error: {
        message: 'Token de acesso é obrigatório',
        code: 'VALIDATION_ERROR',
        status: 401,
      },
    }
  }

  const supabase = createServerSupabaseClient(accessToken)

  // Verificar se o usuário está autenticado e é admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return {
      error: {
        message: 'Usuário não autenticado',
        code: 'UNAUTHORIZED',
        status: 401,
      },
    }
  }

  // Verificar se é admin
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return {
      error: {
        message:
          'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
        code: 'FORBIDDEN',
        status: 403,
      },
    }
  }

  return { userData, supabase }
}

// GET - Buscar cupom específico
export async function GET(
  req: Request,
  context: { params: Promise<{ couponId: string }> },
): Promise<Response> {
  try {
    const params = await context.params
    const accessCheck = await checkAdminAccess(req)

    if (accessCheck.error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: accessCheck.error,
        }),
        {
          status: accessCheck.error.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select(
        `
        *,
        created_by_user:users(name, email)
      `,
      )
      .eq('id', params.couponId)
      .single()

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Cupom não encontrado',
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: coupon,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao buscar cupom:', error)

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

// PUT - Atualizar cupom
export async function PUT(
  req: Request,
  context: { params: Promise<{ couponId: string }> },
): Promise<Response> {
  try {
    const params = await context.params
    const accessCheck = await checkAdminAccess(req)

    if (accessCheck.error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: accessCheck.error,
        }),
        {
          status: accessCheck.error.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const body = await req.json()
    const validatedData = updateCouponSchema.parse(body)

    // Converter código para maiúsculo após validação, se fornecido
    const processedData = {
      ...validatedData,
      ...(validatedData.code && { code: validatedData.code.toUpperCase() }),
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verificar se o cupom existe
    const { data: existingCoupon, error: findError } = await supabaseAdmin
      .from('coupons')
      .select('id, code')
      .eq('id', params.couponId)
      .single()

    if (findError || !existingCoupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Cupom não encontrado',
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Se está mudando o código, verificar se já existe outro cupom com esse código
    if (processedData.code && processedData.code !== existingCoupon.code) {
      const { data: duplicateCoupon } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', processedData.code)
        .neq('id', params.couponId)
        .single()

      if (duplicateCoupon) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'Já existe um cupom com este código',
              code: 'DUPLICATE_COUPON',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    // Atualizar cupom
    const { data: updatedCoupon, error: updateError } = await supabaseAdmin
      .from('coupons')
      .update(processedData)
      .eq('id', params.couponId)
      .select()
      .single()

    if (updateError || !updatedCoupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao atualizar cupom',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedCoupon,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error)

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

// DELETE - Deletar cupom
export async function DELETE(
  req: Request,
  context: { params: Promise<{ couponId: string }> },
): Promise<Response> {
  try {
    const params = await context.params
    const accessCheck = await checkAdminAccess(req)

    if (accessCheck.error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: accessCheck.error,
        }),
        {
          status: accessCheck.error.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verificar se o cupom existe
    const { data: existingCoupon, error: findError } = await supabaseAdmin
      .from('coupons')
      .select('id, code')
      .eq('id', params.couponId)
      .single()

    if (findError || !existingCoupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Cupom não encontrado',
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se o cupom já foi usado
    const { data: couponUsage, error: usageError } = await supabaseAdmin
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', params.couponId)
      .limit(1)

    if (usageError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao verificar uso do cupom',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (couponUsage && couponUsage.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Não é possível deletar um cupom que já foi utilizado. Você pode desativá-lo em vez disso.',
            code: 'COUPON_IN_USE',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Deletar cupom
    const { error: deleteError } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', params.couponId)

    if (deleteError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao deletar cupom',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cupom deletado com sucesso',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao deletar cupom:', error)

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
