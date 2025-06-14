import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  ApiResponse,
  externalSkinDataSchema,
  transformExternalSkinData,
  getExchangeRate,
} from '@/lib/types/skin'
import { z } from 'zod'

const fetchInventoryRequestSchema = z.object({
  steamId: z.string().min(1, 'Steam ID é obrigatório'),
  steamLoginSecure: z.string().min(1, 'Steam Login Secure é obrigatório'),
})

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

    const body = await req.json()
    const validatedData = fetchInventoryRequestSchema.parse(body)

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

    // Montar a URL da API externa
    const steamApiUrl = new URL(
      'https://www.steamwebapi.com/steam/api/inventory',
    )
    steamApiUrl.searchParams.append('key', STEAM_API_KEY)
    steamApiUrl.searchParams.append('steam_id', validatedData.steamId)
    steamApiUrl.searchParams.append(
      'steam_login_secure',
      validatedData.steamLoginSecure,
    )

    // Fazer a requisição para a API externa
    const steamResponse = await fetch(steamApiUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'XTSkins/1.0',
      },
    })

    if (!steamResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Erro ao buscar inventário do Steam: ${steamResponse.status}`,
            code: 'STEAM_API_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const steamData = await steamResponse.json()

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
    for (const skin of steamData) {
      try {
        const validatedSkin = externalSkinDataSchema.parse(skin)
        validatedSkins.push(validatedSkin)
      } catch (error) {
        // Log do erro mas continua processando outras skins
        console.warn('Skin inválida ignorada:', error)
      }
    }

    if (validatedSkins.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Nenhuma skin válida encontrada no inventário',
            code: 'NO_VALID_SKINS',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Obter taxa de câmbio atual
    const exchangeRate = await getExchangeRate()
    console.log(`Taxa de câmbio utilizada: 1 USD = ${exchangeRate} BRL`)

    // Transformar e preparar as skins para o banco
    const transformedSkins = validatedSkins.map((skin) => ({
      ...transformExternalSkinData(skin, exchangeRate),
      user_id: userData.user.id,
      steamid: validatedData.steamId,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Salvar as skins no banco usando upsert para evitar duplicatas
    const { data, error } = await supabase
      .from('skins')
      .upsert(transformedSkins, {
        onConflict: 'assetid',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Erro ao salvar skins:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao salvar skins no banco de dados',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result: ApiResponse<{
      message: string
      totalSkins: number
      savedSkins: number
      skins: typeof data
    }> = {
      success: true,
      data: {
        message: `${validatedSkins.length} skins processadas com sucesso`,
        totalSkins: validatedSkins.length,
        savedSkins: data?.length || 0,
        skins: data,
      },
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro interno:', error)

    // Se for erro de validação do Zod, retorna mensagem específica
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados inválidos fornecidos',
            code: 'VALIDATION_ERROR',
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
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
