import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApiResponse, Skin, skinSchema } from '@/lib/types/skin'

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
              'Acesso negado. Apenas administradores podem acessar esta rota',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar todas as skins do administrador (visíveis e não visíveis)
    const { data, error } = await supabase
      .from('skins')
      .select('*')
      .eq('user_id', userData.user.id)

    if (error) {
      console.error('Erro no banco:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar skins do administrador',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validar cada skin usando o schema e tratar price_manually_set null
    const validatedSkins = data.map((skin) => {
      // Se price_manually_set for null, define como false antes da validação
      const skinWithDefaultPriceManuallySet = {
        ...skin,
        price_manually_set: skin.price_manually_set ?? false,
      }
      return skinSchema.parse(skinWithDefaultPriceManuallySet)
    })

    // Ordenar por preço (maior para menor) - mesma lógica dos outros endpoints
    const sortedSkins = validatedSkins.sort((a, b) => {
      const priceA = parseFloat(a.discount_price || a.price || '0')
      const priceB = parseFloat(b.discount_price || b.price || '0')
      return priceB - priceA // Ordem decrescente (maior para menor)
    })

    const result: ApiResponse<Skin[]> = {
      success: true,
      data: sortedSkins,
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
