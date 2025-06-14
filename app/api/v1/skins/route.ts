import { createClient } from '@supabase/supabase-js'
import { ApiResponse, Skin, skinSchema } from '@/lib/types/skin'

export async function GET(): Promise<Response> {
  try {
    // Usa service_role key para acessar todas as skins
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data, error } = await supabase
      .from('skins')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro no banco:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar skins',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const validatedSkins = data.map((skin) => skinSchema.parse(skin))

    const result: ApiResponse<Skin[]> = {
      success: true,
      data: validatedSkins,
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
