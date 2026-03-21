import { catalogItemRowSchema, type CatalogItemRow } from '@/lib/types/catalog'
import { type Skin, skinSchema } from '@/lib/types/skin'

/** UUID sentinela só para resposta da API; não precisa existir em public.users */
export const CATALOG_LISTING_USER_ID =
  '00000000-0000-0000-0000-000000000001'

export function catalogRowToOrderSkinDisplay(row: {
  id: string
  markethashname: string
  image: string
  wear: string | null
  list_price: string | number | null
  discount_price?: string | number | null
}) {
  const list = String(row.list_price ?? 0)
  const disc =
    row.discount_price != null && row.discount_price !== ''
      ? String(row.discount_price)
      : list
  return {
    id: row.id,
    markethashname: row.markethashname,
    image: row.image,
    wear: row.wear || '',
    discount_price: disc,
    price: list,
    tradable: true,
    isstattrak: false,
    issouvenir: false,
  }
}

export function mapCatalogRowToSkin(row: CatalogItemRow): Skin {
  const parsed = catalogItemRowSchema.parse(row)
  const list = Number(parsed.list_price)
  const disc =
    parsed.discount_price != null && parsed.discount_price !== ''
      ? Number(parsed.discount_price)
      : list
  const discount =
    list > 0 && disc < list ? Math.round(((list - disc) / list) * 100) : 0

  const raw = {
    id: parsed.id,
    user_id: CATALOG_LISTING_USER_ID,
    steamid: '',
    assetid: `catalog:${parsed.id}`,
    classid: 'catalog',
    instanceid: '0',
    markethashname: parsed.markethashname,
    marketname: parsed.marketname,
    normalizedname: null,
    slug: null,
    price: String(list),
    discount_price: String(disc),
    discount,
    image: parsed.image,
    rarity: null,
    color: null,
    bordercolor: null,
    quality: null,
    type: parsed.type,
    sub_type: parsed.sub_type,
    itemgroup: null,
    itemname: null,
    itemtype: null,
    wear: parsed.wear || '',
    tradable: true,
    marketable: true,
    isstar: false,
    isstattrak: false,
    issouvenir: false,
    stickers: [] as { name: string; image: string }[],
    charms: [] as { name: string; image: string }[],
    inspectlink: null,
    steamurl: null,
    is_visible: parsed.is_visible,
    price_manually_set: true,
    float_value: null,
    count: 1,
    created_at: parsed.created_at,
    updated_at: parsed.updated_at,
    listing_source: 'catalog' as const,
  }
  return skinSchema.parse(raw)
}
