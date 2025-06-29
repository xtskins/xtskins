import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// ID único desta instância do servidor
const INSTANCE_ID = randomUUID()

// Armazenar sessões Steam ativas apenas desta instância
const activeSteamSessions = new Map<string, LoginSession>()

// Interface para dados da sessão Steam
interface SteamQRAuthData {
  sessionId: string
  qrUrl: string
  steamSession: LoginSession
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
        metadata: { instanceId: INSTANCE_ID }, // Metadados da instância
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

// Função para atualizar status da sessão
async function updateSessionStatus(
  accessToken: string,
  sessionId: string,
  status: 'completed' | 'failed' | 'expired',
  refreshToken?: string,
): Promise<void> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (refreshToken) {
      updateData.refresh_token = refreshToken
    }

    await supabase
      .from('steam_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .eq('instance_id', INSTANCE_ID) // Apenas a instância que criou pode atualizar
  } catch (error) {
    console.error('Erro ao atualizar status da sessão:', error)
  }
}

// Removida função isMySession - não utilizada na nova implementação

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

// Função para criar QR Code usando steam-session (sem polling automático)
async function createSteamQRAuth(): Promise<SteamQRAuthData | null> {
  try {
    console.log('Criando sessão Steam...')

    // Criar sessão Steam mas não iniciar polling automático
    const session = new LoginSession(EAuthTokenPlatformType.WebBrowser)
    const sessionId = Math.random().toString(36).substring(7)

    // Apenas iniciar QR, não aguardar polling
    const { qrChallengeUrl } = await session.startWithQR()

    if (!qrChallengeUrl) {
      throw new Error('Falha ao obter QR Challenge URL')
    }

    console.log('QR Code criado:', qrChallengeUrl)

    // Armazenar sessão Steam para polling controlado
    activeSteamSessions.set(sessionId, session)

    return {
      sessionId,
      qrUrl: qrChallengeUrl,
      steamSession: session,
    }
  } catch (error) {
    console.error('Erro ao criar QR Auth:', error)
    return null
  }
}

// Removida função checkSteamAuthStatus - usando eventos da steam-session diretamente

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

    // Criar QR Code usando API direta
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

    // Iniciar polling da instância proprietária
    startSessionPolling(accessToken, qrAuthData)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionId: qrAuthData.sessionId,
          qrUrl: qrAuthData.qrUrl,
          message:
            'Processo de autenticação Steam iniciado. Escaneie o QR code.',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao iniciar autenticação Steam:', error)

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

// Função para fazer polling apenas na instância proprietária
function startSessionPolling(accessToken: string, qrAuthData: SteamQRAuthData) {
  const session = qrAuthData.steamSession

  // Configurar eventos da sessão Steam
  session.on('authenticated', async () => {
    console.log('✅ Sessão Steam autenticada:', qrAuthData.sessionId)
    try {
      if (session.refreshToken) {
        const steamAuth = SteamAuthService.getInstance()
        await steamAuth.saveRefreshToken(accessToken, session.refreshToken)

        await updateSessionStatus(
          accessToken,
          qrAuthData.sessionId,
          'completed',
          session.refreshToken,
        )

        console.log('✅ Refresh token salvo com sucesso')
      }
    } catch (error) {
      console.error('❌ Erro ao salvar refresh token:', error)
      await updateSessionStatus(accessToken, qrAuthData.sessionId, 'failed')
    } finally {
      activeSteamSessions.delete(qrAuthData.sessionId)
    }
  })

  session.on('error', async (error) => {
    console.error('❌ Erro na sessão Steam:', error)
    await updateSessionStatus(accessToken, qrAuthData.sessionId, 'failed')
    activeSteamSessions.delete(qrAuthData.sessionId)
  })

  // Timeout após 10 minutos
  setTimeout(
    () => {
      if (activeSteamSessions.has(qrAuthData.sessionId)) {
        console.log('⏰ Timeout da sessão Steam:', qrAuthData.sessionId)
        updateSessionStatus(accessToken, qrAuthData.sessionId, 'expired')
        activeSteamSessions.delete(qrAuthData.sessionId)
      }
    },
    10 * 60 * 1000,
  )
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

    // Primeiro, verificar se já existe refresh token (autenticação concluída)
    try {
      const steamAuth = SteamAuthService.getInstance()
      const refreshToken = await steamAuth.getRefreshToken(accessToken)

      if (refreshToken) {
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
      console.error('Erro ao verificar refresh token:', error)
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

    // Se a sessão foi concluída e tem refresh token
    if (sessionStatus.status === 'completed' && sessionStatus.refreshToken) {
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

    // Retornar status baseado no banco
    const status =
      sessionStatus.status === 'completed'
        ? 'completed'
        : sessionStatus.status === 'failed'
          ? 'failed'
          : sessionStatus.status === 'expired'
            ? 'expired'
            : 'pending'

    if (status === 'failed' || status === 'expired') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              status === 'expired'
                ? 'Sessão expirada'
                : 'Falha na autenticação',
            code:
              status === 'expired'
                ? 'SESSION_EXPIRED'
                : 'AUTHENTICATION_FAILED',
          },
        }),
        {
          status: status === 'expired' ? 410 : 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

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
    console.error('Erro ao verificar status da autenticação:', error)

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
