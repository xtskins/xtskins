import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import {
  createCatalogItemSchema,
  catalogItemRowSchema,
} from '@/lib/types/catalog'

async function requireAdmin(req: Request) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Token obrigatório', code: 'VALIDATION_ERROR' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  const supabase = createServerSupabaseClient(accessToken)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Não autenticado', code: 'UNAUTHORIZED' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Acesso negado', code: 'FORBIDDEN' },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  return { accessToken, userId: userData.user.id }
}

export async function GET(req: Request): Promise<Response> {
  const auth = await requireAdmin(req)
  if ('error' in auth && auth.error) return auth.error

  const admin = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!)

  const { data, error } = await admin
    .from('catalog_items')
    .select('*')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: 'Erro ao listar catálogo', code: 'DATABASE_ERROR' },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({ success: true, data: data ?? [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: Request): Promise<Response> {
  const auth = await requireAdmin(req)
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json()
  const parsed = createCatalogItemSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const admin = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!)

  const p = parsed.data

  const { data, error } = await admin
    .from('catalog_items')
    .insert({
      markethashname: p.markethashname,
      marketname: p.marketname,
      image: p.image,
      wear: p.wear ?? '',
      type: p.type ?? null,
      sub_type: p.sub_type ?? null,
      list_price: p.list_price,
      discount_price: p.discount_price ?? null,
      reference_price_steam: p.reference_price_steam ?? null,
      is_visible: p.is_visible ?? true,
      sort_order: p.sort_order ?? 0,
      notes: p.notes ?? null,
    })
    .select('*')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message, code: 'DATABASE_ERROR' },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const row = catalogItemRowSchema.parse(data)

  return new Response(JSON.stringify({ success: true, data: row }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
