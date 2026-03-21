import { requireAdminBearer } from '@/lib/server/auth/requireAdminBearer'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import {
  fetchSteamItemsSearch,
  getSteamWebApiKey,
  normalizeSteamItemRow,
} from '@/lib/server/steam-market/steamWebApiCatalog'

export async function GET(req: Request): Promise<Response> {
  const auth = await requireAdminBearer(req)
  if (!auth.ok) return auth.response

  const key = getSteamWebApiKey()
  if (!key) {
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

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 3) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Use pelo menos 3 caracteres na busca.',
          code: 'VALIDATION_ERROR',
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const raw = await fetchSteamItemsSearch(q, 40)
    const admin = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!)
    const hashes = [
      ...new Set(
        raw
          .map((r) => String(r.markethashname ?? '').trim())
          .filter(Boolean),
      ),
    ]

    let inCatalog = new Set<string>()
    if (hashes.length) {
      const { data: existing } = await admin
        .from('catalog_items')
        .select('markethashname')
        .in('markethashname', hashes)
      inCatalog = new Set(
        (existing || []).map((e) => String((e as { markethashname: string }).markethashname)),
      )
    }

    const hits = raw.map((row) => {
      const n = normalizeSteamItemRow(row)
      return {
        markethashname: n.markethashname,
        marketname: n.marketname,
        image: n.image,
        wear: n.wear,
        pricelatestUsd: n.pricelatestUsd,
        pricerealUsd: n.pricerealUsd,
        inCatalog: n.markethashname ? inCatalog.has(n.markethashname) : false,
      }
    })

    return new Response(JSON.stringify({ success: true, data: hits }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro na busca Steam'
    return new Response(
      JSON.stringify({
        success: false,
        error: { message, code: 'STEAM_API_ERROR' },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
