import { after } from 'next/server'
import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'

/** Mantém a função serverless viva o suficiente para salvar o token após o POST retornar (Vercel). */
const AUTH_AFTER_MAX_MS = 240_000

// Armazenar sessões temporariamente (em produção, considere usar Redis)
const activeSessions = new Map<string, LoginSession>()

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

    let done = false
    let resolveLatch!: () => void
    const afterAuthWork = new Promise<void>((resolve) => {
      resolveLatch = () => resolve()
    })

    const signalAuthWorkDone = () => {
      if (done) return
      done = true
      resolveLatch()
    }

    // Configurar evento de autenticação
    session.on('authenticated', async () => {
      try {
        if (session.refreshToken) {
          const steamAuth = SteamAuthService.getInstance()
          const result = await steamAuth.saveRefreshToken(
            accessToken,
            session.refreshToken,
          )
          if (!result.success) {
            console.error(
              '[steam-auth/qr] saveRefreshToken falhou:',
              result.error,
            )
          }
        } else {
          console.warn('[steam-auth/qr] authenticated sem refreshToken')
        }
      } catch (e) {
        console.error('[steam-auth/qr] erro no handler authenticated:', e)
      } finally {
        activeSessions.delete(sessionId)
        signalAuthWorkDone()
      }
    })

    session.on('error', (error) => {
      console.error('Erro na autenticação Steam:', error)
      activeSessions.delete(sessionId)
      signalAuthWorkDone()
    })

    // Iniciar processo de autenticação
    const { qrChallengeUrl } = await session.startWithQR()

    after(async () => {
      await Promise.race([
        afterAuthWork,
        new Promise<void>((r) => setTimeout(r, AUTH_AFTER_MAX_MS)),
      ])
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

    // Em serverless (ex.: Vercel), POST e GET podem cair em instâncias diferentes;
    // o Map em memória não é compartilhado. "Sessão ausente" NÃO significa concluída.
    // O cliente continua em pending e usa /steam-auth/check (DB) como fonte da verdade.
    if (!session) {
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
