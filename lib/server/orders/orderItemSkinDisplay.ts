import { catalogRowToOrderSkinDisplay } from '@/lib/server/catalog/mapCatalogToSkin'

export type OrderItemSkinRow = {
  id: string
  markethashname: string
  image: string
  wear: string | null
  discount_price: string | number | null
  price: string | number | null
  tradable: boolean
  isstattrak: boolean
  issouvenir: boolean
}

export function skinRowToOrderDisplay(skin: OrderItemSkinRow) {
  return {
    id: skin.id,
    markethashname: skin.markethashname,
    image: skin.image,
    wear: skin.wear || '',
    discount_price: String(skin.discount_price ?? skin.price ?? '0'),
    price: String(skin.price ?? '0'),
    tradable: skin.tradable,
    isstattrak: skin.isstattrak,
    issouvenir: skin.issouvenir,
  }
}

export type CatalogOrderRow = {
  id: string
  markethashname: string
  image: string
  wear: string | null
  list_price: string | number | null
  discount_price?: string | number | null
}

export function buildSkinDisplayForOrderItem(
  item: { skin_id: string | null; catalog_item_id: string | null },
  skinsMap: Map<string, OrderItemSkinRow>,
  catalogMap: Map<string, CatalogOrderRow>,
) {
  if (item.skin_id) {
    const skin = skinsMap.get(item.skin_id)
    if (skin) return skinRowToOrderDisplay(skin)
  }
  if (item.catalog_item_id) {
    const cat = catalogMap.get(item.catalog_item_id)
    if (cat) return catalogRowToOrderSkinDisplay(cat)
  }
  const ref = item.skin_id || item.catalog_item_id || 'unknown'
  return {
    id: ref,
    markethashname: 'Item não encontrado',
    image: '/placeholder-skin.jpg',
    wear: '',
    price: '0',
    discount_price: '0',
    tradable: false,
    isstattrak: false,
    issouvenir: false,
  }
}
