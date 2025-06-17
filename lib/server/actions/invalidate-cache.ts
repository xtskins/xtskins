'use server'

import { revalidatePath } from 'next/cache'
import { invalidateSkinsCache, refreshSkinsCache } from '../cache/skins-cache'

/**
 * Server Action para invalidar o cache das skins
 */
export async function invalidateSkinsServerCache() {
  try {
    console.log('🔄 Iniciando invalidação do cache das skins...')

    // Invalida o cache em memória
    invalidateSkinsCache()
    console.log('✅ Cache em memória invalidado')

    // Revalida todas as páginas e layouts possíveis de forma mais abrangente
    const pathsToRevalidate = [
      '/',
      '/skins',
      '/admin',
      '/profile',
      '/inventory',
    ]

    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path, 'page')
        revalidatePath(path, 'layout')
        console.log(`✅ Revalidação de ${path} concluída`)
      } catch (error) {
        console.log(`⚠️  Erro ao revalidar ${path}:`, error)
      }
    }

    // Força a revalidação do layout raiz
    revalidatePath('/', 'layout')
    console.log('✅ Layout raiz revalidado')

    // Opcionalmente, força a atualização do cache
    await refreshSkinsCache()
    console.log('✅ Cache refreshado com novos dados')

    return { success: true, message: 'Cache das skins invalidado com sucesso' }
  } catch (error) {
    console.error('❌ Erro ao invalidar cache das skins:', error)
    return {
      success: false,
      message: 'Erro ao invalidar cache das skins',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Server Action para forçar atualização do cache das skins
 */
export async function forceRefreshSkinsCache() {
  try {
    console.log('🔄 Iniciando refresh forçado do cache das skins...')

    // Força a atualização do cache
    const skinsData = await refreshSkinsCache()
    console.log(
      `✅ Cache atualizado: ${skinsData.skins.length} skins, ${skinsData.skinTypes.length} tipos`,
    )

    // Revalida todas as páginas e layouts possíveis
    const pathsToRevalidate = [
      '/',
      '/skins',
      '/admin',
      '/profile',
      '/inventory',
    ]

    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path, 'page')
        revalidatePath(path, 'layout')
        console.log(`✅ Revalidação de ${path} concluída`)
      } catch (error) {
        console.log(`⚠️  Erro ao revalidar ${path}:`, error)
      }
    }

    // Força a revalidação do layout raiz
    revalidatePath('/', 'layout')
    console.log('✅ Layout raiz revalidado')

    return {
      success: true,
      message: 'Cache das skins atualizado com sucesso',
      data: skinsData,
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar cache das skins:', error)
    return {
      success: false,
      message: 'Erro ao atualizar cache das skins',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
