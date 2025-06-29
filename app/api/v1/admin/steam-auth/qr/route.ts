import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// Armazenar sessões apenas da instância atual
const activeSessions = new Map<string, LoginSession>()

// ID único desta instância do servidor
const INSTANCE_ID = randomUUID()

// Função para registrar sessão no banco
async function registerSession(
  accessToken: string,
  sessionId: string,
  qrUrl: string,
): Promise<{ success: boolean; userId?: string }> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return { success: false }
    }

    const { error } = await supabase.from('steam_sessions').upsert({
      session_id: sessionId,
      user_id: userData.user.id,
      instance_id: INSTANCE_ID,
      status: 'pending',
      qr_url: qrUrl,
      updated_at: new Date().toISOString(),
    })

    return { success: !error, userId: userData.user.id }
  } catch (error) {
    console.error('Erro ao registrar sessão:', error)
    return { success: false }
  }
}

// Função para atualizar status da sessão
async function updateSessionStatus(
  accessToken: string,
  sessionId: string,
  status: 'completed' | 'failed' | 'expired',
): Promise<void> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    await supabase
      .from('steam_sessions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('instance_id', INSTANCE_ID) // Apenas a instância que criou pode atualizar
  } catch (error) {
    console.error('Erro ao atualizar status da sessão:', error)
  }
}

// Função para verificar se a sessão pertence a esta instância
async function isMySession(
  accessToken: string,
  sessionId: string,
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const { data, error } = await supabase
      .from('steam_sessions')
      .select('instance_id')
      .eq('session_id', sessionId)
      .single()

    return !error && data?.instance_id === INSTANCE_ID
  } catch (error) {
    console.error('Erro ao verificar ownership da sessão:', error)
    return false
  }
}

// Função para verificar status da sessão no banco
async function getSessionStatus(
  accessToken: string,
  sessionId: string,
): Promise<{ status?: string; found: boolean }> {
  try {
    const supabase = createServerSupabaseClient(accessToken)
    const { data, error } = await supabase
      .from('steam_sessions')
      .select('status, expires_at')
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

    return { status: data.status, found: true }
  } catch (error) {
    console.error('Erro ao verificar status da sessão:', error)
    return { found: false }
  }
}

// Função para limpar sessão
function cleanupSession(sessionId: string) {
  activeSessions.delete(sessionId)
  // Não precisa limpar do banco, deixa expirar naturalmente
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

    // Criar nova sessão Steam
    const session = new LoginSession(EAuthTokenPlatformType.WebBrowser)
    const sessionId = Math.random().toString(36).substring(7)

    // Iniciar processo de autenticação
    const { qrChallengeUrl } = await session.startWithQR()

    // Registrar sessão no banco
    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Token de acesso inválido',
            code: 'INVALID_TOKEN',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const registerResult = await registerSession(
      accessToken,
      sessionId,
      qrChallengeUrl!,
    )
    if (!registerResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao registrar sessão',
            code: 'REGISTRATION_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Armazenar sessão localmente
    activeSessions.set(sessionId, session)

    // Capturar accessToken no escopo para usar nos callbacks
    const tokenForCallbacks = accessToken as string

    // Configurar evento de autenticação
    session.on('authenticated', async () => {
      console.log('✅ Sessão autenticada:', sessionId)
      try {
        if (session.refreshToken) {
          const steamAuth = SteamAuthService.getInstance()
          await steamAuth.saveRefreshToken(
            tokenForCallbacks,
            session.refreshToken,
          )
          await updateSessionStatus(tokenForCallbacks, sessionId, 'completed')
        }
      } catch (error) {
        console.error('Erro ao salvar refresh token:', error)
        await updateSessionStatus(tokenForCallbacks, sessionId, 'failed')
      } finally {
        cleanupSession(sessionId)
      }
    })

    session.on('error', async (error) => {
      console.error('❌ Erro na sessão Steam:', sessionId, error)
      await updateSessionStatus(tokenForCallbacks, sessionId, 'failed')
      cleanupSession(sessionId)
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionId,
          qrUrl: qrChallengeUrl,
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

    // Se a sessão pertence a esta instância, verificar se ainda está ativa
    const isOwner = await isMySession(accessToken, sessionId)
    if (isOwner) {
      const session = activeSessions.get(sessionId)
      if (session?.refreshToken) {
        // Autenticação foi concluída mas ainda não foi processada
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
