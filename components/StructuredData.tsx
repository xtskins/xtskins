'use client'

import { Skin, SkinType } from '@/lib/types/skin'

interface StructuredDataProps {
  skins?: Skin[]
  skinTypes?: SkinType[]
}

export function StructuredData({
  skins = [],
  skinTypes = [],
}: StructuredDataProps) {
  // Dados da organização
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'XTSkins',
    url: 'https://xtskins.com.br',
    logo: 'https://xtskins.com.br/logo.png',
    description: 'A maior loja de skins CS2 do Brasil',
    sameAs: ['https://twitter.com/xtskins', 'https://instagram.com/xtskins_'],
  }

  // Dados do site
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'XTSkins',
    url: 'https://xtskins.com.br',
    description: 'Loja online de skins CS2 com os melhores preços',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://xtskins.com.br/?type={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  // Dados do catálogo de produtos
  const catalogData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de Skins CS2',
    description: 'Coleção completa de skins Counter-Strike 2',
    numberOfItems: skins.length,
    itemListElement: skins.slice(0, 20).map((skin, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: skin.marketname || skin.markethashname,
        description: `Skin ${skin.marketname} para Counter-Strike 2`,
        image: skin.image,
        category: skin.type,
        brand: 'Valve Corporation',
        offers: {
          '@type': 'Offer',
          price: skin.discount_price || skin.price,
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          url: `https://xtskins.com.br/skin/${skin.slug}`,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          reviewCount: '100',
        },
      },
    })),
  }

  // Breadcrumb para categorias
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://xtskins.com.br',
      },
      ...skinTypes.map((type, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: type.type,
        item: `https://xtskins.com.br/?type=${encodeURIComponent(type.type)}`,
      })),
    ],
  }

  // FAQ sobre skins
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O que são skins CS2?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Skins CS2 são itens cosméticos para armas no jogo Counter-Strike 2. Elas mudam a aparência das armas sem afetar a jogabilidade.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como comprar skins CS2?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Na XTSkins você pode comprar skins CS2 de forma segura. Escolha suas skins favoritas, adicione ao carrinho e finalize a compra.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quais tipos de skins vocês vendem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vendemos skins para Rifles (AK-47, M4A4), Pistolas (Glock-18, Desert Eagle), SMGs, Sniper Rifles (AWP) e Machine Guns.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(catalogData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData),
        }}
      />
    </>
  )
}
