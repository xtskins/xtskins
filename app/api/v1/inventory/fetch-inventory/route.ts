import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  externalSkinDataSchema,
  transformExternalSkinData,
  getExchangeRate,
} from '@/lib/types/skin'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { fetchPublicSteamCs2Inventory } from '@/lib/steam/community-inventory'
import { invalidateSkinsAndRevalidate } from '@/lib/server/cache/skins-cache'
import { z } from 'zod'

/** Só steamwebapi.com; sem variável, usamos só inventário público (community JSON). */
function getSteamWebApiComKey(): string | null {
  const k = process.env.STEAM_API_KEY?.trim()
  return k || null
}

async function fetchInventoryFromSteamWebApi(
  steamId: string,
  steamLoginSecure: string,
): Promise<unknown[] | null> {
  const key = getSteamWebApiComKey()
  if (!key) return null

  const steamApiUrl = new URL(
    'https://www.steamwebapi.com/steam/api/inventory',
  )
  steamApiUrl.searchParams.append('key', key)
  steamApiUrl.searchParams.append('steam_id', steamId)
  steamApiUrl.searchParams.append('steam_login_secure', steamLoginSecure)
  steamApiUrl.searchParams.append('no_cache', '1')

  const steamResponse = await fetch(steamApiUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'XTSkins/1.0',
    },
  })

  if (!steamResponse.ok) return null
  const steamData: unknown = await steamResponse.json()
  return Array.isArray(steamData) ? steamData : null
}

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
            message: 'Unauthorized.',
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

    const communityOnly =
      process.env.INVENTORY_USE_STEAM_COMMUNITY_ONLY === 'true'

    let steamData: unknown[] | null = null
    let inventorySource: 'steamwebapi' | 'steam_community_public' | null = null
    let hadSteamLoginSecure = false
    let webApiAuthError: string | undefined

    if (!communityOnly && getSteamWebApiComKey()) {
      const steamAuth = SteamAuthService.getInstance()
      const authResult = await steamAuth.getSteamLoginSecure(accessToken)

      if (authResult.success && authResult.steamLoginSecure) {
        hadSteamLoginSecure = true
        steamData = await fetchInventoryFromSteamWebApi(
          steamId,
          authResult.steamLoginSecure,
        )
        if (steamData?.length) inventorySource = 'steamwebapi'
      } else {
        webApiAuthError = authResult.error
        console.log(
          '[inventory] steam_login_secure indisponível, tentando inventário público:',
          authResult.error,
        )
      }
    }

    if (!steamData?.length) {
      try {
        const publicSkins = await fetchPublicSteamCs2Inventory(steamId)
        steamData = publicSkins
        inventorySource = 'steam_community_public'
      } catch (pubErr) {
        const pubMsg =
          pubErr instanceof Error ? pubErr.message : 'Falha inventário público'

        if (communityOnly || !getSteamWebApiComKey()) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                message: pubMsg,
                code: 'STEAM_COMMUNITY_INVENTORY_ERROR',
              },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (!hadSteamLoginSecure) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                message: `Inventário público: ${pubMsg}. Login Steam (QR): ${webApiAuthError ?? 'sem token'}.`,
                code: 'STEAM_AUTH_AND_PUBLIC_FAILED',
                details: { publicError: pubMsg, authError: webApiAuthError },
              },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: `Inventário público: ${pubMsg}. Com steam_login_secure a API externa não retornou itens; verifique STEAM_API_KEY e conta steamwebapi.com.`,
              code: 'STEAM_API_EMPTY_OR_FAILED',
              details: { publicError: pubMsg },
            },
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    const response = await processInventoryData(
      steamData,
      supabase,
      userData,
      steamId,
    )

    if (inventorySource === 'steam_community_public' && response.ok) {
      const clone = response.clone()
      const body = await clone.json()
      const next = {
        ...body,
        data: {
          ...(body.data ?? {}),
          inventorySource: 'steam_community_public',
          note:
            'Preços podem estar zerados; defina manualmente ou use login Steam + steamwebapi.com para preços automáticos.',
        },
      }
      return new Response(JSON.stringify(next), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return response
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
): Promise<Response> {
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

  for (let i = 0; i < steamData.length; i++) {
    const skin = steamData[i]

    try {
      const validatedSkin = externalSkinDataSchema.parse(skin)
      validatedSkins.push(validatedSkin)
    } catch (error) {
      invalidSkins.push({
        assetid: skin.assetid,
        markethashname: skin.markethashname,
        error: error instanceof Error ? error.message : error,
      })
    }
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

  // Buscar skins atuais do usuário no banco para comparação
  const { data: existingSkins, error: fetchError } = await supabase
    .from('skins')
    .select('assetid, price_manually_set, discount_price')
    .eq('user_id', userData.user.id)
    .eq('steamid', steamId)

  if (fetchError) {
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

  // VERIFICAÇÃO PALIATIVA: Detectar falha silenciosa da API externa
  // Se o usuário já tem skins no banco e TODAS as skins retornadas têm tradable=true,
  // isso indica uma falha silenciosa da API externa
  const userHasExistingSkins = existingSkins && existingSkins.length > 0

  if (userHasExistingSkins) {
    const allSkinsAreTradable = validatedSkins.every(
      (skin) => skin.tradable === true,
    )

    if (allSkinsAreTradable) {
      console.log(
        '⚠️ [API_FAILURE_DETECTION] Possível falha silenciosa da API externa detectada:',
        {
          userHasExistingSkins,
          totalValidatedSkins: validatedSkins.length,
          allSkinsAreTradable,
          steamId,
        },
      )

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Falha temporária na API do Steam detectada. Todas as skins retornadas estão como tradable=true, o que indica um problema na API externa. Tente novamente em alguns minutos.',
            code: 'STEAM_API_TEMPORARY_FAILURE',
            details: {
              totalSkins: validatedSkins.length,
              allTradable: allSkinsAreTradable,
              userHasExistingSkins,
              suggestion:
                'A API externa está com falha silenciosa. Aguarde alguns minutos e tente novamente.',
            },
          },
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // Obter assetids do inventário atual e das skins existentes no banco
  const currentAssetIds = new Set(validatedSkins.map((skin) => skin.assetid))
  const existingAssetIds = new Set(
    existingSkins?.map((skin: { assetid: string }) => skin.assetid) || [],
  )

  // Criar mapa das skins com preço manualmente definido
  const manuallySetPrices = new Map(
    existingSkins
      ?.filter(
        (skin: { price_manually_set: boolean }) => skin.price_manually_set,
      )
      .map((skin: { assetid: string; discount_price: string }) => [
        skin.assetid,
        skin.discount_price,
      ]) || [],
  )

  // Identificar skins que foram vendidas/removidas (existem no banco mas não no inventário atual)
  const soldAssetIds = Array.from(existingAssetIds).filter(
    (assetId) => !currentAssetIds.has(assetId as string),
  )

  // Identificar skins novas (existem no inventário atual mas não no banco)
  const newAssetIds = Array.from(currentAssetIds).filter(
    (assetId) => !existingAssetIds.has(assetId as string),
  )

  // Deletar skins que foram vendidas
  if (soldAssetIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('skins')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('steamid', steamId)
      .in('assetid', soldAssetIds)

    if (deleteError) {
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
  }

  // Transformar e preparar as skins atuais para o banco
  const transformedSkins = validatedSkins.map((skin) => {
    const baseTransformedSkin = transformExternalSkinData(skin, exchangeRate)

    // Se a skin tem preço manualmente definido, preservar o discount_price e price_manually_set
    if (manuallySetPrices.has(skin.assetid)) {
      const manualPrice = manuallySetPrices.get(skin.assetid)

      return {
        ...baseTransformedSkin,
        user_id: userData.user.id,
        steamid: steamId,
        updated_at: new Date().toISOString(),
        discount_price: manualPrice,
        price_manually_set: true,
      }
    }

    return {
      ...baseTransformedSkin,
      user_id: userData.user.id,
      steamid: steamId,
      updated_at: new Date().toISOString(),
      price_manually_set: false, // Define explicitamente como false para novas skins
    }
  })

  const { error } = await supabase.from('skins').upsert(transformedSkins, {
    onConflict: 'assetid',
  })

  if (error) {
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
  // Invalidar cache das skins para que as alterações sejam visíveis imediatamente
  try {
    await invalidateSkinsAndRevalidate()
  } catch (cacheError) {
    console.error('⚠️ Erro ao invalidar cache das skins:', cacheError)
    // Não falha a operação se o cache falhar, apenas loga o erro
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Inventário atualizado com sucesso',
      data: {
        totalSkinsReceived: steamData.length,
        totalSkins: validatedSkins.length,
        savedSkins: newAssetIds.length,
        deletedSkins: soldAssetIds.length,
        invalidSkins: invalidSkins.length,
        exchangeRate,
        invalidSkinsDetails: invalidSkins,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
