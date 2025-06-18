'use server'

import {
  invalidateSkinsAndRevalidate,
  refreshSkinsAndRevalidate,
} from '../cache/skins-cache'

/**
 * Server Action para invalidar o cache das skins
 */
export async function invalidateSkinsServerCache() {
  try {
    console.log('🔄 Iniciando invalidação do cache das skins...')

    // Invalida o cache em memória e revalida as páginas automaticamente
    await invalidateSkinsAndRevalidate()

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

    // Força a atualização do cache e revalida as páginas automaticamente
    const skinsData = await refreshSkinsAndRevalidate()

    console.log(
      `✅ Cache atualizado: ${skinsData.skins.length} skins, ${skinsData.skinTypes.length} tipos`,
    )

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
