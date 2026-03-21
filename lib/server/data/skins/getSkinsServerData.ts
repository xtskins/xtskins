import { createClient } from '@supabase/supabase-js'
import { mapCatalogRowToSkin } from '@/lib/server/catalog/mapCatalogToSkin'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { catalogItemRowSchema } from '@/lib/types/catalog'
import { SkinType, Skin, skinSchema } from '@/lib/types/skin'

export async function getSkinsServerData() {
  try {
    // Usa service_role key para acessar todas as skins
    const supabase = createClient(
      getSupabaseUrl()!,
      getSupabaseServiceRoleKey()!,
    )

    const [{ data: invData }, { data: catData }] = await Promise.all([
      supabase.from('skins').select('type, sub_type').eq('is_visible', true),
      supabase
        .from('catalog_items')
        .select('type, sub_type')
        .eq('is_visible', true),
    ])

    const rows = [...(invData || []), ...(catData || [])]

    // Agrupa os tipos e sub_tipos
    const typeMap = new Map<string, Set<string>>()

    rows.forEach((skin) => {
      // Verifica se type e sub_type não são null e não são strings vazias
      if (
        skin.type &&
        skin.sub_type &&
        skin.type.trim() &&
        skin.sub_type.trim()
      ) {
        if (!typeMap.has(skin.type)) {
          typeMap.set(skin.type, new Set())
        }
        typeMap.get(skin.type)?.add(skin.sub_type)
      }
    })

    // Converte para o formato esperado
    const skinTypes: SkinType[] = Array.from(typeMap.entries()).map(
      ([type, subTypesSet]) => ({
        type,
        sub_types: Array.from(subTypesSet).sort(),
      }),
    )

    return { skinTypes }
  } catch (error) {
    console.error('Erro ao buscar dados das skins no servidor:', error)
    return { skinTypes: [] }
  }
}

export async function getAllSkinsServerData() {
  try {
    // Usa service_role key para acessar todas as skins
    const supabase = createClient(
      getSupabaseUrl()!,
      getSupabaseServiceRoleKey()!,
    )

    const [{ data: invSkins, error: invError }, { data: catRows, error: catError }] =
      await Promise.all([
        supabase.from('skins').select('*').eq('is_visible', true),
        supabase
          .from('catalog_items')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order', { ascending: false }),
      ])

    if (invError) {
      console.error('Erro no banco (skins):', invError)
    }
    if (catError) {
      console.error('Erro no banco (catalog_items):', catError)
    }

    const validatedSkins: Skin[] = []

    for (const skin of invSkins || []) {
      try {
        const validatedSkin = skinSchema.parse(skin)
        validatedSkins.push(validatedSkin)
      } catch (error) {
        console.error('Erro ao validar skin:', {
          assetid: skin.assetid,
          markethashname: skin.markethashname,
          error: error instanceof Error ? error.message : error,
        })
      }
    }

    for (const row of catRows || []) {
      try {
        const cat = catalogItemRowSchema.parse(row)
        validatedSkins.push(mapCatalogRowToSkin(cat))
      } catch (error) {
        console.error('Erro ao validar catalog_item:', {
          id: row.id,
          error: error instanceof Error ? error.message : error,
        })
      }
    }

    // Ordena por preço (maior para menor) - mesma lógica do FilterContext
    const sortedSkins = validatedSkins.sort((a, b) => {
      const priceA = parseFloat(a.discount_price || a.price || '0')
      const priceB = parseFloat(b.discount_price || b.price || '0')
      return priceB - priceA // Ordem decrescente (maior para menor)
    })

    return { skins: sortedSkins }
  } catch (error) {
    console.error('Erro ao buscar todas as skins no servidor:', error)
    return { skins: [] }
  }
}
