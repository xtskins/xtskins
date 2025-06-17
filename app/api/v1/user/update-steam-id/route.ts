import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types/user'

export async function PATCH(req: Request): Promise<Response> {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    const body = await req.json()
    const { steamId } = body

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'AccessToken é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!steamId || typeof steamId !== 'string' || !steamId.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Steam ID é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Atualizar o steam_id do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({ steam_id: steamId.trim() })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar steam_id:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao salvar Steam ID',
            code: 'UPDATE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result: ApiResponse<null> = {
      success: true,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro interno:', error)
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
