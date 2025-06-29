import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST - Marcar autenticação Steam como concluída (webhook/manual)
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
    const { sessionId, refreshToken } = body

    if (!sessionId || !refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'SessionId e refreshToken são obrigatórios',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('🎯 Processando conclusão da autenticação Steam:', {
      sessionId,
      refreshTokenPreview: refreshToken.substring(0, 20) + '...',
    })

    // Salvar refresh token no sistema
    const steamAuth = SteamAuthService.getInstance()
    await steamAuth.saveRefreshToken(accessToken, refreshToken)

    // Atualizar status da sessão no banco
    const supabase = createServerSupabaseClient(accessToken)
    const { error: updateError } = await supabase
      .from('steam_sessions')
      .update({
        status: 'completed',
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error('Erro ao atualizar sessão no banco:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Erro ao atualizar sessão: ${updateError.message}`,
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('✅ Autenticação Steam concluída com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Autenticação Steam concluída com sucesso',
          sessionId,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('❌ Erro ao processar conclusão da autenticação:', error)

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
