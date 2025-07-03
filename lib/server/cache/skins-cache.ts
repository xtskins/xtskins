import {
  getAllSkinsServerData,
  getSkinsServerData,
} from '../data/skins/getSkinsServerData'
import { Skin, SkinType } from '@/lib/types/skin'
// eslint-disable-next-line camelcase
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

let skinsCache: {
  skins: Skin[]
  skinTypes: SkinType[]
  lastUpdate: number
  ttl: number
} | null = null

let isUpdating = false
let updatePromise: Promise<void> | null = null

const CACHE_TTL = process.env.NODE_ENV === 'development' ? 0 : 2 * 60 * 1000 // 2 min em produção, sem cache em dev

// Tags de cache para invalidação
const SKINS_CACHE_TAG = 'skins-data'
const SKIN_TYPES_CACHE_TAG = 'skin-types-data'

/**
 * Função com cache tagged para buscar todas as skins
 */
const getCachedAllSkins = unstable_cache(
  async () => {
    console.log('🔄 Buscando dados de todas as skins (sem cache)...')
    return await getAllSkinsServerData()
  },
  ['all-skins'],
  {
    tags: [SKINS_CACHE_TAG],
    revalidate: 300, // 5 minutos
  },
)

/**
 * Função com cache tagged para buscar tipos de skins
 */
const getCachedSkinTypes = unstable_cache(
  async () => {
    console.log('🔄 Buscando tipos de skins (sem cache)...')
    return await getSkinsServerData()
  },
  ['skin-types'],
  {
    tags: [SKIN_TYPES_CACHE_TAG],
    revalidate: 300, // 5 minutos
  },
)

/**
 * Função pública para buscar skins com cache tags (para usar no layout)
 */
export async function getCachedSkinsForLayout() {
  console.log('🏠 Buscando dados das skins para o layout...')

  try {
    const [allSkinsData, skinsData] = await Promise.all([
      getCachedAllSkins(),
      getCachedSkinTypes(),
    ])

    console.log('✅ Dados carregados para layout:', {
      skinsCount: allSkinsData.skins.length,
      skinTypesCount: skinsData.skinTypes.length,
    })

    return {
      skins: allSkinsData.skins,
      skinTypes: skinsData.skinTypes,
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados para layout:', error)
    // Fallback para o método antigo se derro
    return await getCachedSkins()
  }
}

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

    updatePromise = Promise.all([getCachedAllSkins(), getCachedSkinTypes()])
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
 * Invalida o cache das skins usando tags (melhor para ISR)
 */
export async function invalidateSkinsWithTags() {
  console.log('🔄 Invalidando cache das skins usando tags...')

  // Invalida o cache em memória
  invalidateSkinsCache()

  try {
    // Invalida as tags de cache específicas
    revalidateTag(SKINS_CACHE_TAG)
    revalidateTag(SKIN_TYPES_CACHE_TAG)
    console.log('✅ Tags de cache invalidadas:', [
      SKINS_CACHE_TAG,
      SKIN_TYPES_CACHE_TAG,
    ])

    // Também revalida as páginas como fallback
    revalidatePath('/', 'page')
    revalidatePath('/', 'layout')
    console.log('✅ Páginas revalidadas')
  } catch (error) {
    console.error('❌ Erro ao invalidar tags de cache:', error)
  }
}

/**
 * Invalida o cache das skins e revalida as páginas do Next.js
 */
export async function invalidateSkinsAndRevalidate() {
  console.log('🔄 Invalidando cache e revalidando páginas...')

  // Invalida o cache em memória
  invalidateSkinsCache()

  // Revalida as páginas do Next.js para forçar regeneração
  try {
    const pathsToRevalidate = [
      '/', // página inicial
      '/skins', // se houver uma página de skins específica
    ]

    for (const path of pathsToRevalidate) {
      revalidatePath(path, 'page')
      console.log(`✅ Página ${path} revalidada`)
    }

    // Também revalida o layout para garantir que os dados são atualizados
    revalidatePath('/', 'layout')
    console.log('✅ Layout revalidado')

    // Em produção, força revalidação adicional
    if (process.env.NODE_ENV === 'production') {
      // Revalida todas as rotas estáticas que podem estar cacheadas
      revalidatePath('/', 'layout')
      revalidatePath('/')
      console.log('✅ Revalidação adicional para produção executada')
    }
  } catch (error) {
    console.error('❌ Erro ao revalidar páginas:', error)
  }
}

/**
 * Invalida o cache das skins e revalida as páginas do Next.js com abordagem mais agressiva para produção
 */
export async function forceInvalidateForProduction() {
  console.log('🔄 Invalidação agressiva para produção...')

  // Invalida o cache em memória
  invalidateSkinsCache()

  try {
    // Revalida múltiplas vezes para garantir que funcione
    const paths = ['/', '/skins', '/admin']

    for (const path of paths) {
      // Revalida como página
      revalidatePath(path, 'page')
      // Revalida como layout também
      revalidatePath(path, 'layout')
      console.log(`✅ Página ${path} revalidada (página e layout)`)
    }

    // Força revalidação da raiz múltiplas vezes
    revalidatePath('/')
    revalidatePath('/', 'page')
    revalidatePath('/', 'layout')

    console.log('✅ Invalidação agressiva para produção concluída')
  } catch (error) {
    console.error('❌ Erro na invalidação agressiva:', error)
  }
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

/**
 * Força a atualização do cache das skins e revalida as páginas
 */
export async function refreshSkinsAndRevalidate() {
  console.log('🔄 Forçando refresh do cache das skins com revalidação...')

  // Invalida o cache atual
  invalidateSkinsCache()

  // Busca novos dados
  const result = await getCachedSkins(true)

  // Revalida as páginas
  try {
    const pathsToRevalidate = [
      '/', // página inicial
      '/skins', // se houver uma página de skins específica
    ]

    for (const path of pathsToRevalidate) {
      revalidatePath(path, 'page')
      console.log(`✅ Página ${path} revalidada`)
    }

    // Também revalida o layout
    revalidatePath('/', 'layout')
    console.log('✅ Layout revalidado')

    // Em produção, força revalidação adicional
    if (process.env.NODE_ENV === 'production') {
      // Revalida todas as rotas estáticas que podem estar cacheadas
      revalidatePath('/', 'layout')
      revalidatePath('/')
      console.log('✅ Revalidação adicional para produção executada')
    }
  } catch (error) {
    console.error('❌ Erro ao revalidar páginas:', error)
  }

  console.log('✅ Cache refreshado e páginas revalidadas com sucesso')
  return result
}
