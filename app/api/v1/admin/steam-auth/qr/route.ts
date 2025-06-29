import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { SteamAuthService } from '@/lib/steam/steam-auth-service'

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

    // Configurar evento de autenticação de forma assíncrona
    session.on('authenticated', async () => {
      try {
        // Salvar refresh token no banco
        if (session.refreshToken) {
          const steamAuth = SteamAuthService.getInstance()
          await steamAuth.saveRefreshToken(accessToken, session.refreshToken)
          console.log('Refresh token salvo com sucesso')
        }
      } catch (error) {
        console.error(
          'Erro ao salvar refresh token:',
          error instanceof Error ? error.message : String(error),
        )
      }
    })

    session.on('error', (error) => {
      console.error('Erro na autenticação Steam:', error)
    })

    // Iniciar processo de autenticação
    const { qrChallengeUrl } = await session.startWithQR()

    // Não armazenar a sessão em memória - deixar que a biblioteca gerencie
    // Iniciar polling em background de forma não-bloqueante
    setImmediate(async () => {
      try {
        await session.refreshAccessToken()
      } catch (error) {
        // Ignorar erros de polling em background
        console.log(
          'Polling finalizado ou erro esperado:',
          error instanceof Error ? error.message : String(error),
        )
      }
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

    // Em vez de verificar a sessão em memória, verificar se já existe refresh token no banco
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

    // Se não tem refresh token, ainda está pendente
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
