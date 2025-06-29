import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'

// Armazenar sessões temporariamente (em produção, considere usar Redis)
const activeSessions = new Map<string, LoginSession>()

// Armazenar timestamps de criação das sessões para timeout
const sessionTimestamps = new Map<string, number>()

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

    // Armazenar sessão temporariamente
    activeSessions.set(sessionId, session)
    sessionTimestamps.set(sessionId, Date.now())

    // Configurar evento de autenticação
    session.on('authenticated', async () => {
      // Salvar refresh token no banco
      if (session.refreshToken) {
        const steamAuth = SteamAuthService.getInstance()
        await steamAuth.saveRefreshToken(accessToken, session.refreshToken)
      }

      // Limpar sessão após salvar
      activeSessions.delete(sessionId)
      sessionTimestamps.delete(sessionId)
    })

    session.on('error', (error) => {
      console.error('Erro na autenticação Steam:', error)
      activeSessions.delete(sessionId)
      sessionTimestamps.delete(sessionId)
    })

    // Iniciar processo de autenticação
    const { qrChallengeUrl } = await session.startWithQR()

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

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'ID da sessão é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const session = activeSessions.get(sessionId)
    const sessionCreatedAt = sessionTimestamps.get(sessionId)

    if (!session) {
      // Primeiro, sempre verificar se a autenticação já foi salva no banco
      // (isso resolve problemas de múltiplas instâncias em produção)
      try {
        const steamAuth = SteamAuthService.getInstance()
        const refreshToken = await steamAuth.getRefreshToken(
          req.headers.get('authorization')?.replace('Bearer ', '') || '',
        )

        if (refreshToken) {
          // Autenticação foi concluída, limpar timestamp se existir
          if (sessionCreatedAt) {
            sessionTimestamps.delete(sessionId)
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
        console.error('Erro ao verificar refresh token:', error)
      }

      // Se temos timestamp, verificar se a sessão expirou
      if (sessionCreatedAt) {
        const sessionAge = Date.now() - sessionCreatedAt
        if (sessionAge > 10 * 60 * 1000) {
          // 10 minutos
          sessionTimestamps.delete(sessionId)
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
      }

      // Sessão ainda está pendente (pode ser problema de instâncias diferentes)
      // Retornar pending em vez de erro para permitir continuar o polling
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
    }

    // Verificar se já foi autenticado
    const isAuthenticated = !!session.refreshToken

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: isAuthenticated ? 'completed' : 'pending',
          authenticated: isAuthenticated,
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
