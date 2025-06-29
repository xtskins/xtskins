import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// ID único desta instância do servidor
const INSTANCE_ID = randomUUID()

// Interface para dados da sessão Steam
interface SteamQRAuthData {
  sessionId: string
  qrUrl: string
}

// Função para registrar sessão no banco
async function registerSession(
  accessToken: string,
  sessionId: string,
  qrUrl: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error('Erro ao obter usuário:', userError)
      return { success: false, error: `User error: ${userError?.message}` }
    }

    console.log('Registrando sessão:', {
      sessionId,
      userId: userData.user.id,
      instanceId: INSTANCE_ID,
    })

    const { data, error } = await supabase
      .from('steam_sessions')
      .upsert({
        session_id: sessionId,
        user_id: userData.user.id,
        instance_id: INSTANCE_ID,
        status: 'pending',
        qr_url: qrUrl,
        metadata: { instanceId: INSTANCE_ID },
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Erro ao inserir na tabela steam_sessions:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return { success: false, error: error.message }
    }

    console.log('Sessão registrada com sucesso:', data)
    return { success: true, userId: userData.user.id }
  } catch (error) {
    console.error('Erro inesperado ao registrar sessão:', error)
    return { success: false, error: String(error) }
  }
}

// Função para verificar status da sessão no banco
async function getSessionStatus(
  accessToken: string,
  sessionId: string,
): Promise<{ status?: string; found: boolean; refreshToken?: string }> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const { data, error } = await supabase
      .from('steam_sessions')
      .select('status, expires_at, refresh_token, metadata')
      .eq('session_id', sessionId)
      .single()

    if (error || !data) {
      return { found: false }
    }

    // Verificar se expirou
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    if (now > expiresAt) {
      // Marcar como expirada
      await supabase
        .from('steam_sessions')
        .update({ status: 'expired' })
        .eq('session_id', sessionId)

      return { status: 'expired', found: true }
    }

    return {
      status: data.status,
      found: true,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    console.error('Erro ao verificar status da sessão:', error)
    return { found: false }
  }
}

// Função para criar QR Code de forma simples
async function createSteamQRAuth(): Promise<SteamQRAuthData | null> {
  try {
    console.log('🔄 Criando QR Code Steam (modo simples)...')

    const session = new LoginSession(EAuthTokenPlatformType.WebBrowser)
    const sessionId = Math.random().toString(36).substring(7)

    const { qrChallengeUrl } = await session.startWithQR()

    if (!qrChallengeUrl) {
      throw new Error('Falha ao obter QR Challenge URL')
    }

    console.log('✅ QR Code criado:', qrChallengeUrl)

    return {
      sessionId,
      qrUrl: qrChallengeUrl,
    }
  } catch (error) {
    console.error('❌ Erro ao criar QR Auth:', error)
    return null
  }
}

// POST - Iniciar processo de autenticação Steam
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

    console.log('🚀 Iniciando processo de autenticação Steam...')

    // Criar QR Code
    const qrAuthData = await createSteamQRAuth()
    if (!qrAuthData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao criar QR Code Steam',
            code: 'STEAM_API_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Registrar sessão no banco
    const registerResult = await registerSession(
      accessToken,
      qrAuthData.sessionId,
      qrAuthData.qrUrl,
    )

    if (!registerResult.success) {
      console.error('Falha ao registrar sessão:', registerResult.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Erro ao registrar sessão: ${registerResult.error}`,
            code: 'REGISTRATION_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('✅ QR Code e sessão criados com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionId: qrAuthData.sessionId,
          qrUrl: qrAuthData.qrUrl,
          message:
            'QR Code gerado. O frontend fará o polling para detectar a autenticação.',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('❌ Erro geral ao iniciar autenticação Steam:', error)

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

// GET - Verificar status da autenticação
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!sessionId || !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'SessionId e token de acesso são obrigatórios',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('🔍 Verificando status da sessão:', sessionId)

    // Primeiro, verificar se já existe refresh token no sistema
    try {
      const steamAuth = SteamAuthService.getInstance()
      const refreshToken = await steamAuth.getRefreshToken(accessToken)

      if (refreshToken) {
        console.log('✅ Refresh token já existe no sistema')

        // Marcar sessão como completed no banco se ainda estiver pending
        try {
          const supabase = createServerSupabaseClient(accessToken)
          await supabase
            .from('steam_sessions')
            .update({
              status: 'completed',
              refresh_token: refreshToken,
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .eq('status', 'pending')
        } catch (updateError) {
          console.log('⚠️ Erro ao atualizar status (não crítico):', updateError)
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'completed',
              authenticated: true,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar refresh token (não crítico):', error)
    }

    // Verificar status da sessão no banco
    const sessionStatus = await getSessionStatus(accessToken, sessionId)

    if (!sessionStatus.found) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Sessão não encontrada',
            code: 'SESSION_NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('📊 Status da sessão no banco:', {
      sessionId,
      status: sessionStatus.status,
      hasRefreshToken: !!sessionStatus.refreshToken,
    })

    // Se a sessão foi concluída e tem refresh token
    if (sessionStatus.status === 'completed' && sessionStatus.refreshToken) {
      console.log('✅ Sessão concluída com refresh token')
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: 'completed',
            authenticated: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se expirou
    if (sessionStatus.status === 'expired') {
      console.log('⏰ Sessão expirada')
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Sessão expirada',
            code: 'SESSION_EXPIRED',
          },
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Retornar pending para continuar polling
    console.log('⏳ Sessão ainda pendente')
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: 'pending',
          authenticated: false,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('❌ Erro ao verificar status da autenticação:', error)

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
