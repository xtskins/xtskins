import { getAllSkinsServerData } from '@/lib/server/data/skins/getSkinsServerData'
import { ApiResponse, Skin } from '@/lib/types/skin'

export async function GET(): Promise<Response> {
  try {
    const { skins } = await getAllSkinsServerData()

    const result: ApiResponse<Skin[]> = {
      success: true,
      data: skins,
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
