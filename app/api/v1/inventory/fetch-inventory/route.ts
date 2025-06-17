import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  externalSkinDataSchema,
  transformExternalSkinData,
  getExchangeRate,
} from '@/lib/types/skin'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { z } from 'zod'

interface SkinData {
  assetid: string
  markethashname: string
  marketname: string
}

const STEAM_API_KEY = process.env.STEAM_API_KEY || 'NV0Z3WKMXLZN1X3Q'

export async function POST(req: Request): Promise<Response> {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Token de acesso é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Usuário não autenticado',
            code: 'UNAUTHORIZED',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar o perfil do usuário para obter o steam_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('steam_id, role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Perfil do usuário não encontrado',
            code: 'USER_PROFILE_NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se o usuário é admin
    if (userProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se o usuário tem steam_id cadastrado
    if (!userProfile.steam_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Steam ID não cadastrado. Por favor, cadastre seu Steam ID primeiro.',
            code: 'STEAM_ID_NOT_FOUND',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const steamId = userProfile.steam_id

    // Sempre obter um token fresco do SteamAuthService
    console.log('=== PROCESSO DE AUTENTICAÇÃO STEAM ===')
    console.log('Steam ID do usuário:', steamId)
    console.log('🔄 Obtendo steam_login_secure automaticamente...')

    const steamAuth = SteamAuthService.getInstance()
    const authResult = await steamAuth.getSteamLoginSecure(accessToken)

    if (!authResult.success) {
      console.error('❌ Erro ao obter steam_login_secure:', authResult.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Erro ao obter steam_login_secure: ${authResult.error}`,
            code: 'STEAM_AUTH_ERROR',
            details: authResult.error,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const steamLoginSecure = authResult.steamLoginSecure!
    console.log('✅ steam_login_secure obtido com sucesso!')
    console.log(
      '🔑 Steam Login Secure (primeiros 30 caracteres):',
      steamLoginSecure.substring(0, 30) + '...',
    )

    // Montar a URL da API externa
    console.log('=== PREPARANDO REQUISIÇÃO PARA API DO STEAM ===')
    const steamApiUrl = new URL(
      'https://www.steamwebapi.com/steam/api/inventory',
    )
    steamApiUrl.searchParams.append('key', STEAM_API_KEY)
    steamApiUrl.searchParams.append('steam_id', steamId)
    steamApiUrl.searchParams.append('steam_login_secure', steamLoginSecure)
    steamApiUrl.searchParams.append('no_cache', '1')

    console.log(
      '🌐 URL da API Steam:',
      steamApiUrl
        .toString()
        .replace(steamLoginSecure, steamLoginSecure.substring(0, 30) + '...'),
    )
    console.log('📋 Parâmetros da requisição:')
    console.log('  - Steam ID:', steamId)
    console.log('  - API Key:', STEAM_API_KEY.substring(0, 10) + '...')
    console.log(
      '  - Steam Login Secure (primeiros 30 chars):',
      steamLoginSecure.substring(0, 30) + '...',
    )

    // Fazer a requisição para a API externa
    console.log('🚀 Enviando requisição para a API do Steam...')
    const steamResponse = await fetch(steamApiUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'XTSkins/1.0',
      },
    })

    console.log('📡 Resposta da API Steam:')
    console.log('  - Status:', steamResponse.status)
    console.log('  - Status Text:', steamResponse.statusText)
    console.log(
      '  - Headers:',
      Object.fromEntries(steamResponse.headers.entries()),
    )

    if (!steamResponse.ok) {
      console.log('❌ Erro na requisição Steam:', steamResponse.status)
      console.log('🔍 Detalhes da resposta de erro:')
      const errorText = await steamResponse.text()
      console.log('Response body:', errorText)

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Erro ao buscar inventário do Steam: ${steamResponse.status}`,
            code: 'STEAM_API_ERROR',
            details: {
              status: steamResponse.status,
              statusText: steamResponse.statusText,
              responseBody: errorText,
              steamLoginSecureUsed: steamLoginSecure.substring(0, 20) + '...',
            },
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const steamData = await steamResponse.json()
    console.log('=== RESPOSTA COMPLETA DA API EXTERNA ===')
    console.log(
      '📦 Total de itens recebidos:',
      Array.isArray(steamData) ? steamData.length : 'Não é array',
    )
    console.log('🔍 Tipo de dados recebidos:', typeof steamData)

    if (Array.isArray(steamData) && steamData.length > 0) {
      console.log('🎮 Primeiras 5 skins recebidas:')
      steamData.slice(0, 5).forEach((skin, index) => {
        console.log(
          `  ${index + 1}. ${skin.marketname || skin.markethashname || 'Nome não disponível'}`,
        )
        console.log(`     AssetID: ${skin.assetid}`)
        console.log(`     Raridade: ${skin.rarity || 'N/A'}`)
        console.log(`     Wear: ${skin.wear || 'N/A'}`)
        console.log('     ---')
      })

      if (steamData.length > 5) {
        console.log(`  ... e mais ${steamData.length - 5} skins`)
      }
    }

    console.log(
      '📄 Dados completos (JSON):',
      JSON.stringify(steamData, null, 2),
    )

    return await processInventoryData(
      steamData,
      supabase,
      userData,
      steamId,
      steamLoginSecure,
    )
  } catch (error) {
    console.error('Erro no endpoint de inventário:', error)

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados de entrada inválidos',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// Função auxiliar para processar os dados do inventário

async function processInventoryData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steamData: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any,
  steamId: string,
  steamLoginSecure: string,
): Promise<Response> {
  console.log('=== INICIANDO PROCESSAMENTO DO INVENTÁRIO ===')
  console.log('📈 Quantidade de skins recebidas da API:', steamData.length)
  console.log('👤 Steam ID do usuário:', steamId)
  console.log('🆔 User ID:', userData.user.id)

  console.log('🎮 DETALHES DAS SKINS RECEBIDAS:')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steamData.forEach((skin: any, index: number) => {
    console.log(`  ${index + 1}/${steamData.length}:`)
    console.log(`    📦 AssetID: ${skin.assetid}`)
    console.log(`    🏷️  Market Hash Name: ${skin.markethashname}`)
    console.log(`    📋 Market Name: ${skin.marketname}`)
    console.log(`    🌟 Raridade: ${skin.rarity || 'N/A'}`)
    console.log(`    🔧 Desgaste: ${skin.wear || 'N/A'}`)
    console.log(
      `    💰 Preço 24h: ${skin.pricereal24h || skin.priceavg || skin.pricelatest || 'N/A'}`,
    )
    console.log(`    🔄 Tradável: ${skin.tradable ? 'SIM' : 'NÃO'}`)
    console.log(`    🎨 Cor: ${skin.color || 'N/A'}`)
    console.log(`    📊 Qualidade: ${skin.quality || 'N/A'}`)
    console.log('    ---')
  })

  // Verificar se a resposta tem o formato esperado (array de skins)
  if (!Array.isArray(steamData)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Formato de resposta inválido da API do Steam',
          code: 'INVALID_STEAM_RESPONSE',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Validar cada skin usando o schema
  const validatedSkins = []
  const invalidSkins = []

  console.log('=== INICIANDO VALIDAÇÃO DAS SKINS ===')
  for (let i = 0; i < steamData.length; i++) {
    const skin = steamData[i]
    console.log(`Validando skin ${i + 1}/${steamData.length}:`, {
      assetid: skin.assetid,
      markethashname: skin.markethashname,
    })

    try {
      const validatedSkin = externalSkinDataSchema.parse(skin)
      validatedSkins.push(validatedSkin)
      console.log(`✅ Skin ${skin.assetid} validada com sucesso`)
    } catch (error) {
      // Log detalhado do erro de validação
      console.error(`❌ Erro ao validar skin ${skin.assetid}:`, {
        markethashname: skin.markethashname,
        error: error instanceof Error ? error.message : error,
        skinData: skin,
      })
      invalidSkins.push({
        assetid: skin.assetid,
        markethashname: skin.markethashname,
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  console.log('=== RESULTADO DA VALIDAÇÃO ===')
  console.log('Skins válidas:', validatedSkins.length)
  console.log('Skins inválidas:', invalidSkins.length)
  if (invalidSkins.length > 0) {
    console.log('Detalhes das skins inválidas:', invalidSkins)
  }

  if (validatedSkins.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Nenhuma skin válida encontrada no inventário',
          code: 'NO_VALID_SKINS',
          details: {
            totalReceived: steamData.length,
            invalidSkins,
          },
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Obter taxa de câmbio atual
  const exchangeRate = await getExchangeRate()
  console.log(`Taxa de câmbio utilizada: 1 USD = ${exchangeRate} BRL`)

  // Buscar skins atuais do usuário no banco para comparação
  console.log('=== BUSCANDO SKINS EXISTENTES NO BANCO ===')
  const { data: existingSkins, error: fetchError } = await supabase
    .from('skins')
    .select('assetid')
    .eq('user_id', userData.user.id)
    .eq('steamid', steamId)

  if (fetchError) {
    console.error('Erro ao buscar skins existentes:', fetchError)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro ao buscar skins existentes no banco',
          code: 'DATABASE_ERROR',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  console.log('Skins existentes no banco:', existingSkins?.length || 0)
  console.log(
    'AssetIDs existentes:',
    existingSkins?.map((skin: { assetid: string }) => skin.assetid) || [],
  )

  // Obter assetids do inventário atual e das skins existentes no banco
  const currentAssetIds = new Set(validatedSkins.map((skin) => skin.assetid))
  const existingAssetIds = new Set(
    existingSkins?.map((skin: { assetid: string }) => skin.assetid) || [],
  )

  console.log('AssetIDs do inventário atual:', Array.from(currentAssetIds))
  console.log('AssetIDs existentes no banco:', Array.from(existingAssetIds))

  // Identificar skins que foram vendidas/removidas (existem no banco mas não no inventário atual)
  const soldAssetIds = Array.from(existingAssetIds).filter(
    (assetId) => !currentAssetIds.has(assetId as string),
  )

  console.log('=== SKINS PARA REMOVER (VENDIDAS) ===')
  console.log('Skins para remover:', soldAssetIds.length)
  if (soldAssetIds.length > 0) {
    console.log('AssetIDs para remover:', soldAssetIds)
  }

  // Deletar skins que foram vendidas
  if (soldAssetIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('skins')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('steamid', steamId)
      .in('assetid', soldAssetIds)

    if (deleteError) {
      console.error('Erro ao deletar skins vendidas:', deleteError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao deletar skins vendidas do banco',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
    console.log('✅ Skins vendidas removidas com sucesso')
  }

  // Transformar e preparar as skins atuais para o banco
  console.log('=== TRANSFORMANDO SKINS PARA O BANCO ===')
  const transformedSkins = validatedSkins.map((skin) => ({
    ...transformExternalSkinData(skin, exchangeRate),
    user_id: userData.user.id,
    steamid: steamId,
    updated_at: new Date().toISOString(),
  }))

  console.log('Skins transformadas:', transformedSkins.length)
  console.log(
    'Detalhes das skins transformadas:',
    transformedSkins.map((skin) => ({
      assetid: skin.assetid,
      markethashname: skin.markethashname,
      marketname: skin.marketname,
    })),
  )

  // Salvar/atualizar as skins atuais no banco usando upsert
  console.log('=== SALVANDO SKINS NO BANCO ===')
  console.log(
    'Preparando para inserir/atualizar skins:',
    transformedSkins.length,
  )
  console.log(
    'AssetIDs que serão inseridos:',
    transformedSkins.map((skin) => skin.assetid),
  )

  const { data, error } = await supabase
    .from('skins')
    .upsert(transformedSkins, {
      onConflict: 'assetid',
    })
    .select()

  if (error) {
    console.error('❌ Erro ao salvar skins no banco:', error)
    console.error('Detalhes do erro:', error.message)
    console.error('Código do erro:', error.code)
    console.error('Hint do erro:', error.hint)
    console.error('Details do erro:', error.details)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro ao salvar skins no banco',
          code: 'DATABASE_ERROR',
          details: error.message,
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  console.log('=== RESULTADO FINAL ===')
  console.log('✅ Skins salvas no banco:', data?.length || 0)
  console.log(
    'steamLoginSecure:',
    steamLoginSecure,
    'Detalhes das skins salvas:',
    data?.map((skin: SkinData) => ({
      assetid: skin.assetid,
      markethashname: skin.markethashname,
      marketname: skin.marketname,
    })) || [],
  )

  // Verificar se o número de skins salvas é igual ao número de skins transformadas
  if (data && data.length !== transformedSkins.length) {
    console.warn(
      '⚠️ ATENÇÃO: Número de skins salvas difere do número de skins processadas!',
    )
    console.warn(`Skins transformadas: ${transformedSkins.length}`)
    console.warn(`Skins salvas: ${data.length}`)
    console.warn(
      'AssetIDs transformados:',
      transformedSkins.map((skin) => skin.assetid),
    )
    console.warn(
      'AssetIDs salvos:',
      data.map((skin: SkinData) => skin.assetid),
    )
  }

  console.log('=== PROCESSO CONCLUÍDO COM SUCESSO ===')
  console.log('🎉 Inventário atualizado com sucesso!')
  console.log('📊 RESUMO FINAL:')
  console.log(`  📦 Total de skins recebidas da API: ${steamData.length}`)
  console.log(`  ✅ Skins válidas processadas: ${validatedSkins.length}`)
  console.log(`  💾 Skins salvas/atualizadas no banco: ${data?.length || 0}`)
  console.log(`  🗑️  Skins removidas (vendidas): ${soldAssetIds.length}`)
  console.log(`  ❌ Skins inválidas: ${invalidSkins.length}`)
  console.log(`  💱 Taxa de câmbio utilizada: ${exchangeRate} BRL/USD`)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Inventário atualizado com sucesso',
      data: {
        totalSkinsReceived: steamData.length,
        totalSkins: validatedSkins.length,
        savedSkins: data?.length || 0,
        deletedSkins: soldAssetIds.length,
        invalidSkins: invalidSkins.length,
        exchangeRate,
        invalidSkinsDetails: invalidSkins,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
