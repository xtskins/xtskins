import {
  getAllSkinsServerData,
  getSkinsServerData,
} from '../data/skins/getSkinsServerData'
import { Skin, SkinType } from '@/lib/types/skin'

let skinsCache: {
  skins: Skin[]
  skinTypes: SkinType[]
  lastUpdate: number
  ttl: number
} | null = null

let isUpdating = false
let updatePromise: Promise<void> | null = null

const CACHE_TTL =
  process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 5 * 60 * 1000 // 1 minuto

export async function getCachedSkins(forceRefresh = false) {
  const now = Date.now()

  console.log('🔍 getCachedSkins chamado:', {
    forceRefresh,
    hasCache: !!skinsCache,
    cacheAge: skinsCache ? now - skinsCache.lastUpdate : null,
    ttl: CACHE_TTL,
    isExpired: skinsCache ? now - skinsCache.lastUpdate > skinsCache.ttl : null,
  })

  if (
    !skinsCache ||
    now - skinsCache.lastUpdate > skinsCache.ttl ||
    forceRefresh
  ) {
    console.log('🔄 Cache inválido ou refresh forçado, atualizando...')

    if (isUpdating && updatePromise) {
      console.log('⏳ Aguardando atualização em andamento...')
      await updatePromise
      return {
        skins: skinsCache!.skins,
        skinTypes: skinsCache!.skinTypes,
      }
    }

    isUpdating = true
    console.log('🚀 Iniciando busca de dados das skins...')

    updatePromise = Promise.all([getAllSkinsServerData(), getSkinsServerData()])
      .then(([allSkinsData, skinsData]) => {
        console.log('📦 Dados recebidos:', {
          skinsCount: allSkinsData.skins.length,
          skinTypesCount: skinsData.skinTypes.length,
        })

        skinsCache = {
          skins: allSkinsData.skins,
          skinTypes: skinsData.skinTypes,
          lastUpdate: Date.now(),
          ttl: CACHE_TTL,
        }

        console.log('✅ Cache atualizado com sucesso')
      })
      .catch((error) => {
        console.error('❌ Erro ao atualizar cache:', error)
        throw error
      })
      .finally(() => {
        isUpdating = false
        updatePromise = null
        console.log('🏁 Atualização finalizada')
      })

    await updatePromise
  } else {
    console.log('✅ Usando cache existente')
  }

  return {
    skins: skinsCache!.skins,
    skinTypes: skinsCache!.skinTypes,
  }
}

/**
 * Invalida o cache das skins forçando uma nova busca
 */
export function invalidateSkinsCache() {
  console.log('🗑️  Invalidando cache das skins...')

  const hadCache = !!skinsCache
  const cacheInfo = skinsCache
    ? {
        skinsCount: skinsCache.skins.length,
        skinTypesCount: skinsCache.skinTypes.length,
        age: Date.now() - skinsCache.lastUpdate,
      }
    : null

  skinsCache = null
  isUpdating = false
  updatePromise = null

  console.log('✅ Cache invalidado:', { hadCache, cacheInfo })
}

/**
 * Força a atualização do cache das skins
 */
export async function refreshSkinsCache() {
  console.log('🔄 Forçando refresh do cache das skins...')
  invalidateSkinsCache()
  const result = await getCachedSkins(true)
  console.log('✅ Cache refreshado com sucesso')
  return result
}
