import { z } from 'zod'
import {
  externalSkinDataSchema,
  type ExternalSkinData,
} from '@/lib/types/skin'

const steamTagSchema = z
  .object({
    category: z.string().optional(),
    internal_name: z.string().optional(),
    localized_category_name: z.string().optional(),
    localized_tag_name: z.string().optional(),
  })
  .passthrough()

const steamInvDescSchema = z
  .object({
    classid: z.string(),
    instanceid: z.string().optional(),
    market_hash_name: z.string().optional(),
    market_name: z.string().optional(),
    name: z.string().optional(),
    icon_url: z.string().optional(),
    tradable: z.union([z.number(), z.boolean()]).optional(),
    marketable: z.union([z.number(), z.boolean()]).optional(),
    descriptions: z.array(z.unknown()).optional(),
    tags: z.array(steamTagSchema).optional(),
  })
  .passthrough()

type SteamTag = z.infer<typeof steamTagSchema>

function descKey(classid: string, instanceid: string) {
  return `${classid}_${instanceid || '0'}`
}

function steamImageUrl(iconUrl: string | undefined): string {
  if (!iconUrl) return ''
  const path = iconUrl.startsWith('/') ? iconUrl.slice(1) : iconUrl
  return `https://community.cloudflare.steamstatic.com/economy/image/${path}`
}

function mapTags(tags: SteamTag[] | undefined) {
  if (!tags?.length) return undefined
  return tags.map((t) => ({
    category: t.category || t.localized_category_name || 'Unknown',
    localized_tag_name: t.localized_tag_name || t.internal_name || '',
  }))
}

function parseWear(tags: SteamTag[] | undefined): string | null {
  if (!tags) return null
  const w = tags.find(
    (t) =>
      t.category === 'Exterior' ||
      t.internal_name?.startsWith('WearCategory') ||
      t.localized_category_name === 'Exterior',
  )
  return w?.localized_tag_name?.trim() || null
}

function isSouvenir(name: string) {
  return /souvenir/i.test(name)
}

function isStatTrak(name: string, tags?: SteamTag[]) {
  if (/StatTrak|stattrak/i.test(name)) return true
  return (
    tags?.some(
      (t) =>
        t.internal_name?.includes('StatTrak') ||
        t.localized_tag_name?.includes('StatTrak'),
    ) ?? false
  )
}

function mapDescriptions(
  raw: unknown[] | undefined,
): ExternalSkinData['descriptions'] {
  if (!raw?.length) return undefined
  const out: { type: string; value: string; name?: string }[] = []
  for (const d of raw) {
    if (d && typeof d === 'object' && 'value' in d) {
      const o = d as { type?: string; value?: unknown; name?: string }
      const value = typeof o.value === 'string' ? o.value : String(o.value ?? '')
      const type = typeof o.type === 'string' ? o.type : 'html'
      if (value) out.push({ type, value, name: o.name })
    }
  }
  return out.length ? out : undefined
}

/**
 * Inventário CS2 (app 730, context 2) via JSON público da Steam Community.
 * Não usa Web API key nem cookies — exige perfil/inventário públicos.
 */
export async function fetchPublicSteamCs2Inventory(
  steamId64: string,
): Promise<ExternalSkinData[]> {
  const base = `https://steamcommunity.com/inventory/${encodeURIComponent(steamId64)}/730/2`
  const all: ExternalSkinData[] = []
  let startAssetid: string | undefined

  for (let page = 0; page < 50; page++) {
    const url = new URL(base)
    url.searchParams.set('l', 'english')
    url.searchParams.set('count', '2500')
    if (startAssetid) url.searchParams.set('start_assetid', startAssetid)

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; XTSkins/1.0)',
      },
      cache: 'no-store',
    })

    const text = await res.text()
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(
        `Resposta inválida da Steam (${res.status}). Inventário ou perfil pode estar privado.`,
      )
    }

    const body = json as {
      success?: number | boolean
      Error?: string
      assets?: {
        assetid: string
        classid: string
        instanceid?: string
        amount?: string
      }[]
      descriptions?: Record<string, unknown>[]
      more_items?: number
      last_assetid?: string
    }

    if (body.success === false || body.success === 0) {
      throw new Error(
        body.Error ||
          'Inventário CS2 privado ou indisponível. Deixe o inventário público nas configurações da Steam ou conclua o login Steam (QR) para usar a API com steam_login_secure.',
      )
    }

    const descMap = new Map<string, z.infer<typeof steamInvDescSchema>>()
    for (const rd of body.descriptions || []) {
      const parsed = steamInvDescSchema.safeParse(rd)
      if (!parsed.success) continue
      const d = parsed.data
      descMap.set(descKey(d.classid, d.instanceid || '0'), d)
    }

    for (const a of body.assets || []) {
      const ik = descKey(a.classid, a.instanceid || '0')
      const d = descMap.get(ik)
      if (!d) continue

      const mh = d.market_hash_name?.trim()
      if (!mh) continue

      const marketname = (d.market_name || d.name || mh).trim()
      const tags = d.tags
      const tradable =
        d.tradable === undefined ? true : Boolean(Number(d.tradable))
      const marketable =
        d.marketable === undefined ? true : Boolean(Number(d.marketable))

      const ext: ExternalSkinData = {
        markethashname: mh,
        marketname,
        assetid: String(a.assetid),
        classid: String(a.classid),
        instanceid: String(a.instanceid || '0'),
        image: steamImageUrl(d.icon_url),
        tradable,
        marketable,
        wear: parseWear(tags),
        isstattrak: isStatTrak(marketname, tags),
        issouvenir: isSouvenir(marketname),
        tags: mapTags(tags),
        descriptions: mapDescriptions(d.descriptions),
        count: Math.max(1, parseInt(String(a.amount || '1'), 10) || 1),
        pricelatest: 0,
      }

      const validated = externalSkinDataSchema.safeParse(ext)
      if (validated.success) all.push(validated.data)
    }

    if (!body.more_items || !body.last_assetid) break
    startAssetid = String(body.last_assetid)
  }

  return all
}
