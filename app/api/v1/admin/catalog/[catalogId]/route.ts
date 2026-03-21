import { requireAdminBearer } from '@/lib/server/auth/requireAdminBearer'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import {
  updateCatalogItemSchema,
  catalogItemRowSchema,
} from '@/lib/types/catalog'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ catalogId: string }> },
): Promise<Response> {
  const auth = await requireAdminBearer(req)
  if (!auth.ok) return auth.response

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
