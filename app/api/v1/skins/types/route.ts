import { createClient } from '@supabase/supabase-js'
import { ApiResponse, SkinType } from '@/lib/types/skin'

export async function GET(): Promise<Response> {
  try {
    // Usa service_role key para acessar todas as skins
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await supabase
      .from('skins')
      .select('type, sub_type')
      .eq('is_visible', true)

    if (error) {
      console.error('Erro no banco:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar tipos de skins',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Agrupa os tipos e sub_tipos
    const typeMap = new Map<string, Set<string>>()

    data.forEach((skin) => {
      if (skin.type && skin.sub_type) {
        if (!typeMap.has(skin.type)) {
          typeMap.set(skin.type, new Set())
        }
        typeMap.get(skin.type)?.add(skin.sub_type)
      }
    })

    // Converte para o formato esperado
    const skinTypes: SkinType[] = Array.from(typeMap.entries()).map(
      ([type, subTypesSet]) => ({
        type,
        sub_types: Array.from(subTypesSet).sort(),
      }),
    )

    const result: ApiResponse<SkinType[]> = {
      success: true,
      data: skinTypes,
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
