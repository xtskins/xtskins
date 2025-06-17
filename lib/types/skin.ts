import { z } from 'zod'

// Schema para stickers e charms
export const stickerSchema = z.object({
  name: z.string(),
  image: z.string().url(),
})

export const charmSchema = z.object({
  name: z.string(),
  image: z.string().url(),
})

// Schema para descrições das skins
export const descriptionSchema = z.object({
  type: z.string(),
  value: z.string(),
  name: z.string().optional(),
  color: z.string().optional(),
})

// Schema para os dados recebidos da API externa
export const externalSkinDataSchema = z.object({
  id: z.string(),
  markethashname: z.string(),
  marketname: z.string(),
  normalizedname: z.string().optional(),
  slug: z.string().optional(),
  assetid: z.string(),
  classid: z.string(),
  instanceid: z.string().optional(),
  image: z.string(),
  rarity: z.string().optional(),
  color: z.string().optional(),
  bordercolor: z.string().optional(),
  quality: z.string().optional(),
  tradable: z.boolean().optional(),
  marketable: z.boolean().optional(),
  isstar: z.boolean().optional(),
  isstattrak: z.boolean().optional(),
  issouvenir: z.boolean().optional(),
  itemgroup: z.string().optional(),
  itemname: z.string().optional(),
  itemtype: z.string().optional(),
  wear: z.string().optional().nullable(),
  inspectlink: z.string().optional(),
  steamurl: z.string().optional(),
  count: z.number().default(1),
  pricelatest: z.number().optional(),
  priceavg: z.number().optional(),
  pricereal24h: z.number().optional(),
  tags: z
    .array(
      z.object({
        category: z.string(),
        localized_tag_name: z.string(),
      }),
    )
    .optional(),
  descriptions: z.array(descriptionSchema).optional(),
})

// Schema para a skin no banco de dados
export const skinSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  steamid: z.string(),
  assetid: z.string(),
  classid: z.string(),
  instanceid: z.string(),
  markethashname: z.string(),
  marketname: z.string(),
  normalizedname: z.string().nullable(),
  slug: z.string().nullable(),
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  discount_price: z
    .union([z.string(), z.number()])
    .transform((val) => String(val)),
  discount: z.number(),
  image: z.string(),
  rarity: z.string().nullable(),
  color: z.string().nullable(),
  bordercolor: z.string().nullable(),
  quality: z.string().nullable(),
  type: z.string().nullable(),
  sub_type: z.string().nullable(),
  itemgroup: z.string().nullable(),
  itemname: z.string().nullable(),
  itemtype: z.string().nullable(),
  wear: z.string(),
  tradable: z.boolean(),
  marketable: z.boolean(),
  isstar: z.boolean(),
  isstattrak: z.boolean(),
  issouvenir: z.boolean(),
  stickers: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
    }),
  ),
  charms: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
    }),
  ),
  inspectlink: z.string().nullable(),
  steamurl: z.string().nullable(),
  is_visible: z.boolean(),
  price_manually_set: z.boolean(),
  float_value: z.number().nullable(),
  count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ExternalSkinData = z.infer<typeof externalSkinDataSchema>
export type Skin = z.infer<typeof skinSchema>
export type Sticker = z.infer<typeof stickerSchema>
export type Charm = z.infer<typeof charmSchema>
export type Description = z.infer<typeof descriptionSchema>

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
  }
}

export interface SkinType {
  type: string
  sub_types: string[]
}

// Função para extrair stickers das descriptions
function extractStickers(descriptions: Description[]): Sticker[] {
  const stickerInfo = descriptions.find((desc) => desc.name === 'sticker_info')
  if (!stickerInfo) return []

  const stickerDiv = stickerInfo.value
  const imgRegex = /src="(.*?)".*?title="(.*?)"/g
  const matches = [...stickerDiv.matchAll(imgRegex)]

  return matches.map((match) => ({
    name: match[2].replace('Sticker: ', ''),
    image: match[1],
  }))
}

// Função para extrair charms das descriptions
function extractCharms(descriptions: Description[]): Charm[] {
  const charmInfo = descriptions.find((desc) => desc.name === 'keychain_info')
  if (!charmInfo) return []

  const charmDiv = charmInfo.value
  const imgRegex = /src="(.*?)".*?title="(.*?)"/g
  const matches = [...charmDiv.matchAll(imgRegex)]

  return matches.map((match) => ({
    name: match[2].replace('Charm: ', ''),
    image: match[1],
  }))
}

// Função para calcular desconto
function calcularDesconto(price: number, discountPrice: number): number {
  if (price <= 0 || discountPrice <= 0) return 0
  const desconto = ((price - discountPrice) / price) * 100
  return Math.round(desconto)
}

// Função para calcular preço com desconto
function calcularDiscountPrice(
  priceReal24h: number,
  exchangeRate: number,
): number {
  const priceInBRL = priceReal24h * exchangeRate

  if (priceInBRL <= 90) {
    return priceInBRL * 1.25
  } else if (priceInBRL <= 300) {
    return priceInBRL * 1.15
  } else {
    return priceInBRL * 1.09
  }
}

// Função para obter taxa de câmbio (você pode implementar cache depois)
export async function getExchangeRate(): Promise<number> {
  try {
    const response = await fetch(
      'http://economia.awesomeapi.com.br/json/last/USD-BRL',
    )
    const data = await response.json()

    if (data && data.USDBRL) {
      return parseFloat(data.USDBRL.bid)
    }
  } catch (error) {
    console.error('Erro ao obter taxa de câmbio:', error)
  }

  return 5.6 // Valor padrão
}

// Função para converter dados externos para formato do banco
export function transformExternalSkinData(
  externalData: ExternalSkinData,
  exchangeRate = 5.6,
): Partial<Skin> {
  // Extrair tipo e subtipo das tags
  const typeTag = externalData.tags?.find(
    (tag) => tag.category === 'Type',
  )?.localized_tag_name
  const weaponTag = externalData.tags?.find(
    (tag) => tag.category === 'Weapon',
  )?.localized_tag_name

  // Extrair stickers e charms das descriptions
  const stickers = externalData.descriptions
    ? extractStickers(externalData.descriptions)
    : []
  const charms = externalData.descriptions
    ? extractCharms(externalData.descriptions)
    : []

  // Calcular preços em BRL
  const priceInBRL = (externalData.pricelatest || 0) * exchangeRate
  const discountPrice = externalData.pricereal24h
    ? calcularDiscountPrice(externalData.pricereal24h, exchangeRate)
    : undefined

  const discount = discountPrice
    ? calcularDesconto(priceInBRL, discountPrice)
    : 0

  return {
    assetid: externalData.assetid,
    classid: externalData.classid,
    instanceid: externalData.instanceid,
    markethashname: externalData.markethashname,
    marketname: externalData.marketname,
    normalizedname: externalData.normalizedname || null,
    slug: externalData.slug || null,
    price: priceInBRL.toString(),
    discount_price: discountPrice?.toString() || '',
    discount,
    image: externalData.image,
    rarity: externalData.rarity || null,
    color: externalData.color || null,
    bordercolor: externalData.bordercolor || null,
    quality: externalData.quality || null,
    type: typeTag || null,
    sub_type: weaponTag || null,
    itemgroup: externalData.itemgroup || null,
    itemname: externalData.itemname || null,
    itemtype: externalData.itemtype || null,
    wear: externalData.wear || '',
    tradable: externalData.tradable ?? true,
    marketable: externalData.marketable ?? true,
    isstar: externalData.isstar ?? false,
    isstattrak: externalData.isstattrak ?? false,
    issouvenir: externalData.issouvenir ?? false,
    stickers,
    charms,
    inspectlink: externalData.inspectlink || null,
    steamurl: externalData.steamurl || null,
    count: externalData.count || 1,
  }
}
