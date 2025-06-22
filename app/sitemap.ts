import { MetadataRoute } from 'next'
import { getCachedSkinsForLayout } from '@/lib/server/cache/skins-cache'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xtskins.com.br'

  // Buscar dados das skins para gerar URLs dinâmicas
  const { skinTypes, skins } = await getCachedSkinsForLayout()

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    },
  ]

  // Adicionar URLs das categorias de tipos
  const typeRoutes = skinTypes.map((skinType) => ({
    url: `${baseUrl}/?type=${encodeURIComponent(skinType.type)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Adicionar URLs das subcategorias
  const subTypeRoutes = skinTypes.flatMap((skinType) =>
    skinType.sub_types.map((subType) => ({
      url: `${baseUrl}/?type=${encodeURIComponent(skinType.type)}&subtype=${encodeURIComponent(subType)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  )

  // Adicionar URLs das skins individuais (limitado para performance)
  const skinRoutes = skins.slice(0, 1000).map((skin) => ({
    url: `${baseUrl}/skin/${skin.slug || skin.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...routes, ...typeRoutes, ...subTypeRoutes, ...skinRoutes]
}
