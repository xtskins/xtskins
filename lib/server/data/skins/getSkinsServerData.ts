import { createClient } from '@supabase/supabase-js'
import { SkinType, Skin, skinSchema } from '@/lib/types/skin'

export async function getSkinsServerData() {
  try {
    // Usa service_role key para acessar todas as skins
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data } = await supabase
      .from('skins')
      .select('type, sub_type')
      .eq('is_visible', true)

    if (!data) {
      return { skinTypes: [] }
    }

    // Agrupa os tipos e sub_tipos
    const typeMap = new Map<string, Set<string>>()

    data.forEach((skin) => {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await supabase
      .from('skins')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro no banco:', error)
      return { skins: [] }
    }

    if (!data) {
      return { skins: [] }
    }

    const validatedSkins: Skin[] = []

    for (const skin of data) {
      try {
        const validatedSkin = skinSchema.parse(skin)
        validatedSkins.push(validatedSkin)
      } catch (error) {
        console.error('Erro ao validar skin:', {
          assetid: skin.assetid,
          markethashname: skin.markethashname,
          error: error instanceof Error ? error.message : error,
        })
        // Continua sem esta skin
      }
    }

    return { skins: validatedSkins }
  } catch (error) {
    console.error('Erro ao buscar todas as skins no servidor:', error)
    return { skins: [] }
  }
}
