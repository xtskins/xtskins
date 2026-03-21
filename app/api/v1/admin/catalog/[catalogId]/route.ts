import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import {
  updateCatalogItemSchema,
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

  return {}
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ catalogId: string }> },
): Promise<Response> {
  const auth = await requireAdmin(req)
  if ('error' in auth && auth.error) return auth.error

  const { catalogId } = await context.params
  const body = await req.json()
  const parsed = updateCatalogItemSchema.safeParse(body)
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

  const updatePayload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updatePayload[k] = v
  }

  if (Object.keys(updatePayload).length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: 'Nada para atualizar', code: 'VALIDATION_ERROR' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data, error } = await admin
    .from('catalog_items')
    .update(updatePayload)
    .eq('id', catalogId)
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
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
