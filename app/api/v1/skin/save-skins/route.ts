import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  ApiResponse,
  externalSkinDataSchema,
  transformExternalSkinData,
} from '@/lib/types/skin'
import { z } from 'zod'

const saveSkinRequestSchema = z.object({
  skins: z.array(externalSkinDataSchema),
  steamId: z.string().optional(), // Steam ID do usuário (opcional)
})

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
    const validatedData = saveSkinRequestSchema.parse(body)

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

    const transformedSkins = validatedData.skins.map((skin) => ({
      ...transformExternalSkinData(skin),
      user_id: userData.user.id, // Usar o ID do usuário autenticado
      steamid: validatedData.steamId,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Inserir as skins no banco, usando upsert para evitar duplicatas baseado no assetid
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

    const result: ApiResponse<typeof data> = {
      success: true,
      data,
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
