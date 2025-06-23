import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createCouponSchema } from '@/lib/types/coupon'
import { z } from 'zod'

// GET - Listar todos os cupons (apenas admin)
export async function GET(req: Request): Promise<Response> {
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

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado e é admin
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

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Usar service role para listar todos os cupons
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: coupons, error: couponsError } = await supabaseAdmin
      .from('coupons')
      .select(
        `
        *,
        created_by_user:users(name, email)
      `,
      )
      .order('created_at', { ascending: false })

    if (couponsError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar cupons',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: coupons,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao listar cupons:', error)

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

// POST - Criar novo cupom (apenas admin)
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
    const validatedData = createCouponSchema.parse(body)

    // Converter código para maiúsculo após validação
    const processedData = {
      ...validatedData,
      code: validatedData.code.toUpperCase(),
    }

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado e é admin
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

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Acesso negado. Apenas administradores podem criar cupons.',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Usar service role para criar cupom
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verificar se o código do cupom já existe
    const { data: existingCoupon } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('code', processedData.code)
      .single()

    if (existingCoupon) {
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

    // Criar cupom
    const { data: newCoupon, error: createError } = await supabaseAdmin
      .from('coupons')
      .insert({
        ...processedData,
        created_by: userData.user.id,
        start_date: processedData.start_date || new Date().toISOString(),
        end_date: processedData.end_date || null,
      })
      .select()
      .single()

    if (createError || !newCoupon) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao criar cupom',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: newCoupon,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao criar cupom:', error)

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
