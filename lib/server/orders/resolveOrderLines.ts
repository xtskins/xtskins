export type SkinPriceRow = {
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

export type CatalogPriceRow = {
  id: string
  markethashname: string
  marketname: string
  image: string
  wear: string | null
  list_price: string | number | null
  discount_price: string | number | null
}

export type ResolvedLine =
  | { kind: 'skin'; row: SkinPriceRow }
  | { kind: 'catalog'; row: CatalogPriceRow }

export function resolveProductLines(
  productIds: string[],
  skins: SkinPriceRow[],
  catalogs: CatalogPriceRow[],
): { map: Map<string, ResolvedLine>; missing: string[] } {
  const skinById = new Map(skins.map((s) => [s.id, s]))
  const catById = new Map(catalogs.map((c) => [c.id, c]))
  const map = new Map<string, ResolvedLine>()
  const missing: string[] = []

  for (const id of productIds) {
    const s = skinById.get(id)
    if (s) {
      map.set(id, { kind: 'skin', row: s })
      continue
    }
    const c = catById.get(id)
    if (c) {
      map.set(id, { kind: 'catalog', row: c })
      continue
    }
    missing.push(id)
  }

  return { map, missing }
}

export function unitPriceFromLine(line: ResolvedLine): number {
  if (line.kind === 'skin') {
    return parseFloat(String(line.row.discount_price || line.row.price || '0'))
  }
  const list = Number(line.row.list_price ?? 0)
  const d =
    line.row.discount_price != null && line.row.discount_price !== ''
      ? Number(line.row.discount_price)
      : list
  return d
}

export function listPriceFromLine(line: ResolvedLine): number {
  if (line.kind === 'skin') {
    return parseFloat(String(line.row.price || '0'))
  }
  return Number(line.row.list_price ?? 0)
}
