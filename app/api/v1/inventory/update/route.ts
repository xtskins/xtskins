import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types/skin'
import { z } from 'zod'

const updateInventoryRequestSchema = z.object({
  skinId: z.string().uuid('ID da skin deve ser um UUID válido'),
  discount_price: z.string().optional(),
  is_visible: z.boolean().optional(),
})

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
    const validatedData = updateInventoryRequestSchema.parse(body)

    // Verificar se pelo menos um campo foi enviado para atualização
    if (
      validatedData.discount_price === undefined &&
      validatedData.is_visible === undefined
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Pelo menos um campo deve ser fornecido para atualização (discount_price ou is_visible)',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
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

    // Verificar se o usuário é admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Acesso negado. Apenas administradores podem atualizar skins',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Preparar dados para atualização
    const updateData: {
      updated_at: string
      discount_price?: string
      is_visible?: boolean
    } = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.discount_price !== undefined) {
      updateData.discount_price = validatedData.discount_price
    }

    if (validatedData.is_visible !== undefined) {
      updateData.is_visible = validatedData.is_visible
    }

    // Atualizar a skin
    const { data: updatedSkin, error: updateError } = await supabase
      .from('skins')
      .update(updateData)
      .eq('id', validatedData.skinId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar skin:', updateError)

      if (updateError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'Skin não encontrada',
              code: 'NOT_FOUND',
            },
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao atualizar skin no banco de dados',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result: ApiResponse<typeof updatedSkin> = {
      success: true,
      data: updatedSkin,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro interno:', error)

    // Se for erro de validação do Zod, retorna mensagem específica
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados inválidos fornecidos',
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
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
