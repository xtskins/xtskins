import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request): Promise<Response> {
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

    // Verificar se é admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
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

    // Verificar se o admin tem refresh token configurado
    const { data: steamCredentials, error: credentialsError } = await supabase
      .from('steam_admin_credentials')
      .select('id, created_at, updated_at')
      .eq('user_id', userData.user.id)
      .single()

    if (credentialsError && credentialsError.code !== 'PGRST116') {
      // PGRST116 = não encontrado, outros erros são reais
      console.error('Erro ao verificar steam credentials:', credentialsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao verificar configurações Steam',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const hasRefreshToken = !!steamCredentials

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          hasRefreshToken,
          configured: hasRefreshToken,
          lastUpdated: steamCredentials?.updated_at || null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro no endpoint de verificação Steam auth:', error)

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
