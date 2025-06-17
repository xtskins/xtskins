import { SteamAuthService } from '@/lib/steam/steam-auth-service'
import { z } from 'zod'

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

// POST - Salvar refresh token Steam do admin
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
    const validatedData = refreshTokenSchema.parse(body)

    const steamAuth = SteamAuthService.getInstance()
    const result = await steamAuth.saveRefreshToken(
      accessToken,
      validatedData.refreshToken,
    )

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: result.error,
            code: 'STEAM_AUTH_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refresh token Steam salvo com sucesso',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao salvar refresh token Steam:', error)

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            details: error.errors,
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
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// GET - Obter steam_login_secure atual usando refresh token
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

    const steamAuth = SteamAuthService.getInstance()
    const result = await steamAuth.getSteamLoginSecure(accessToken)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: result.error,
            code: 'STEAM_AUTH_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Se obtivemos um novo refresh token, salvá-lo
    if (result.refreshToken) {
      await steamAuth.updateRefreshToken(accessToken, result.refreshToken)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          steamLoginSecure: result.steamLoginSecure,
          hasRefreshToken: !!result.refreshToken,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao obter steam_login_secure:', error)

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

// DELETE - Remover refresh token (logout)
export async function DELETE(req: Request): Promise<Response> {
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

    const steamAuth = SteamAuthService.getInstance()
    const result = await steamAuth.removeRefreshToken(accessToken)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: result.error,
            code: 'STEAM_AUTH_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refresh token removido com sucesso',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro ao remover refresh token:', error)

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
