import { NextRequest, NextResponse } from 'next/server'
import {
  invalidateSkinsWithTags,
  refreshSkinsAndRevalidate,
} from '@/lib/server/cache/skins-cache'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    console.log('🔄 API Cache chamada com action:', action)

    switch (action) {
      case 'invalidate': {
        console.log('🗑️  Executando invalidação via API...')

        // Invalida o cache usando tags (melhor para ISR)
        await invalidateSkinsWithTags()

        return NextResponse.json(
          {
            success: true,
            message: 'Cache das skins invalidado com sucesso',
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Cache-Control':
                'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
              Pragma: 'no-cache',
              Expires: '0',
              'Surrogate-Control': 'no-store',
              'CDN-Cache-Control': 'no-store',
              'Vercel-CDN-Cache-Control': 'max-age=0',
            },
          },
        )
      }

      case 'refresh': {
        console.log('🔄 Executando refresh via API...')

        // Força a atualização do cache e revalida as páginas automaticamente
        const skinsData = await refreshSkinsAndRevalidate()

        return NextResponse.json(
          {
            success: true,
            message: 'Cache das skins atualizado com sucesso',
            data: {
              skinsCount: skinsData.skins.length,
              skinTypesCount: skinsData.skinTypes.length,
            },
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Cache-Control':
                'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
              Pragma: 'no-cache',
              Expires: '0',
              'Surrogate-Control': 'no-store',
              'CDN-Cache-Control': 'no-store',
              'Vercel-CDN-Cache-Control': 'max-age=0',
            },
          },
        )
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Ação inválida. Use "invalidate" ou "refresh"',
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('❌ Erro na API de cache:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'API de cache das skins',
      actions: {
        invalidate: 'POST com { "action": "invalidate" } - Invalida o cache',
        refresh:
          'POST com { "action": "refresh" } - Força atualização do cache',
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        Pragma: 'no-cache',
        Expires: '0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'max-age=0',
      },
    },
  )
}
