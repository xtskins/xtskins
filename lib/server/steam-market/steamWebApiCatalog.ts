import type { CreateCatalogItemInput } from '@/lib/types/catalog'
import { getExchangeRate } from '@/lib/types/skin'

const BASE = 'https://www.steamwebapi.com/steam/api'

export function getSteamWebApiKey(): string | null {
  const k = process.env.STEAM_API_KEY?.trim()
  return k || null
}

/** Mesma lógica de margem usada em `transformExternalSkinData` (pricereal). */
function suggestedSaleBrlFromThirdPartyUsd(usd: number, rate: number): number {
  const priceInBRL = usd * rate
  if (priceInBRL <= 90) return priceInBRL * 1.25
  if (priceInBRL <= 300) return priceInBRL * 1.15
  return priceInBRL * 1.09
}

function typeFromItemGroup(itemgroup: string | undefined): string | null {
  const g = itemgroup?.trim()
  if (!g) return null
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
}

export function normalizeSteamItemRow(r: Record<string, unknown>) {
  const markethashname = String(r.markethashname ?? '').trim()
  const marketname = String(r.marketname ?? r.markethashname ?? '').trim()
  const image = String(r.itemimage ?? r.image ?? '').trim()
  const wear = String(r.wear ?? '')
  const itemgroup = typeof r.itemgroup === 'string' ? r.itemgroup : undefined
  const itemtype = typeof r.itemtype === 'string' ? r.itemtype : undefined
  const pricelatest =
    typeof r.pricelatest === 'number' && !Number.isNaN(r.pricelatest)
      ? r.pricelatest
      : null
  const pricereal =
    typeof r.pricereal === 'number' && !Number.isNaN(r.pricereal)
      ? r.pricereal
      : null
  return {
    markethashname,
    marketname,
    image,
    wear,
    type: typeFromItemGroup(itemgroup),
    sub_type: itemtype?.trim() || null,
    pricelatestUsd: pricelatest,
    pricerealUsd: pricereal,
  }
}

function parseItemsArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items?: unknown }).items
    if (Array.isArray(items)) return items as Record<string, unknown>[]
  }
  return []
}

export async function fetchSteamItemsSearch(
  query: string,
  max = 40,
): Promise<Record<string, unknown>[]> {
  const key = getSteamWebApiKey()
  if (!key) throw new Error('STEAM_API_KEY ausente')

  const url = new URL(`${BASE}/items`)
  url.searchParams.set('key', key)
  url.searchParams.set('game', 'cs2')
  url.searchParams.set('search', query.trim())
  url.searchParams.set('max', String(max))
  url.searchParams.set(
    'select',
    'markethashname,marketname,itemimage,pricelatest,pricereal,wear,itemgroup,itemtype',
  )

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'XTSkins/1.0' },
    cache: 'no-store',
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Steam API items: ${res.status} ${t.slice(0, 200)}`)
  }
  const data: unknown = await res.json()
  return parseItemsArray(data)
}

export async function fetchSteamSingleItem(
  marketHashName: string,
): Promise<Record<string, unknown> | null> {
  const key = getSteamWebApiKey()
  if (!key) throw new Error('STEAM_API_KEY ausente')

  const url = new URL(`${BASE}/item`)
  url.searchParams.set('key', key)
  url.searchParams.set('market_hash_name', marketHashName)

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'XTSkins/1.0' },
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Steam API item: ${res.status} ${t.slice(0, 200)}`)
  }
  const data: unknown = await res.json()
  if (Array.isArray(data)) {
    const first = (data as Record<string, unknown>[])[0]
    return first ?? null
  }
  if (data && typeof data === 'object') return data as Record<string, unknown>
  return null
}

export async function steamRowToCreateCatalogInput(
  row: Record<string, unknown>,
): Promise<CreateCatalogItemInput> {
  const n = normalizeSteamItemRow(row)
  if (!n.markethashname) throw new Error('Item sem markethashname')
  if (!n.image) throw new Error('Item sem imagem na API')

  const rate = await getExchangeRate()
  const listBrl = (n.pricelatestUsd ?? 0) * rate
  const listRounded = Math.round(listBrl * 100) / 100

  let discountBrl: number | undefined
  if (n.pricerealUsd != null && n.pricerealUsd > 0) {
    discountBrl =
      Math.round(suggestedSaleBrlFromThirdPartyUsd(n.pricerealUsd, rate) * 100) /
      100
  }

  return {
    markethashname: n.markethashname,
    marketname: n.marketname || n.markethashname,
    image: n.image,
    wear: n.wear,
    type: n.type ?? undefined,
    sub_type: n.sub_type ?? undefined,
    list_price: listRounded,
    discount_price: discountBrl,
    reference_price_steam:
      n.pricelatestUsd != null && n.pricelatestUsd > 0 ? listRounded : undefined,
    is_visible: true,
    sort_order: 0,
    notes: null,
  }
}
