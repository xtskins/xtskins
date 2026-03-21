import { requireAdminBearer } from '@/lib/server/auth/requireAdminBearer'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import {
  catalogItemRowSchema,
  createCatalogItemSchema,
} from '@/lib/types/catalog'
import {
  fetchSteamSingleItem,
  getSteamWebApiKey,
  steamRowToCreateCatalogInput,
} from '@/lib/server/steam-market/steamWebApiCatalog'

export async function POST(req: Request): Promise<Response> {
  const auth = await requireAdminBearer(req)
  if (!auth.ok) return auth.response

  if (!getSteamWebApiKey()) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message:
            'Configure STEAM_API_KEY no servidor (mesma chave do inventário).',
          code: 'STEAM_KEY_MISSING',
        },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: 'JSON inválido', code: 'VALIDATION_ERROR' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const markethashname =
    typeof body === 'object' &&
    body !== null &&
    'markethashname' in body &&
    typeof (body as { markethashname: unknown }).markethashname === 'string'
      ? (body as { markethashname: string }).markethashname.trim()
      : ''

  if (!markethashname) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: 'markethashname obrigatório', code: 'VALIDATION_ERROR' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const admin = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!)

  const { data: dup } = await admin
    .from('catalog_items')
    .select('id')
    .eq('markethashname', markethashname)
    .maybeSingle()

  if (dup?.id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Este item já está no catálogo. Edite o preço na lista.',
          code: 'DUPLICATE',
        },
        existingId: dup.id,
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const row = await fetchSteamSingleItem(markethashname)
    if (!row) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Item não encontrado na Steam Web API.',
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await steamRowToCreateCatalogInput(row)
    const parsed = createCatalogItemSchema.safeParse(payload)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados do item inválidos para o catálogo',
            code: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

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

    const catalogRow = catalogItemRowSchema.parse(data)
    return new Response(JSON.stringify({ success: true, data: catalogRow }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao importar item'
    return new Response(
      JSON.stringify({
        success: false,
        error: { message, code: 'STEAM_IMPORT_ERROR' },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
