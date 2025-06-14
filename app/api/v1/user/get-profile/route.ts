import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApiResponse, User, userSchema } from '@/lib/types/user'

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!userId || !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'userId e accessToken são obrigatórios',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createServerSupabaseClient(accessToken)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro no banco:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Usuário não encontrado',
            code: 'USER_NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const validatedUser = userSchema.parse(data)

    const result: ApiResponse<User> = {
      success: true,
      data: validatedUser,
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
