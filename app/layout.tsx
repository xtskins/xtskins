/* eslint-disable camelcase */

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/AuthContext'
import { OrderProvider } from '@/context/OrderContext'
import './globals.css'
import { TanstackProvider } from './providers'
import { ServerDataProvider } from '@/context/ServerDataContext'
import { FilterWrapper } from '@/components/FilterWrapper'

import { AppSidebar } from '@/components/AppSideBar'
import { BreadcrumbNav } from '@/components/BreadCrumbNav'
import { CartButton } from '@/components/CartButton'
import { ThemeToggle } from '@/components/Theme'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { getUserServerData } from '@/lib/server/data/user/getUserServerData'
import { getCachedSkinsForLayout } from '@/lib/server/cache/skins-cache'
import { getSidebarState } from '@/lib/utils/cookies'
import { StructuredData } from '@/components/StructuredData'
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'XTSkins - Skins CS2 | Compre Skins Counter-Strike 2',
  description:
    'A maior loja de skins CS2 do Brasil. Compre skins de Rifles, Pistolas, SMGs e muito mais com os melhores preços e descontos. AK-47, M4A4, AWP e todas as suas skins favoritas.',
  keywords:
    'skins cs2, counter-strike 2, ak-47, m4a4, awp, rifles, pistolas, smg, skins baratas, loja cs2',
  authors: [{ name: 'XTSkins' }],
  creator: 'XTSkins',
  publisher: 'XTSkins',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'XTSkins - Skins CS2 | Compre Skins Counter-Strike 2',
    description:
      'A maior loja de skins CS2 do Brasil. Compre skins de Rifles, Pistolas, SMGs com os melhores preços.',
    url: 'https://xtskins.com.br',
    siteName: 'XTSkins',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'XTSkins - Loja de Skins CS2',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XTSkins - Skins CS2 | Compre Skins Counter-Strike 2',
    description:
      'A maior loja de skins CS2 do Brasil. Rifles, Pistolas, SMGs com os melhores preços.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'seu-google-site-verification-code-aqui',
  },
}

export const revalidate = 300 // 5 minutos - ISR para performance

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [userData, skinsData, sidebarOpen] = await Promise.all([
    getUserServerData(),
    getCachedSkinsForLayout(),
    getSidebarState(),
  ])

  const serverData = {
    user: userData.user,
    profile: userData.profile,
    skinTypes: skinsData.skinTypes,
    skins: skinsData.skins,
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <StructuredData
          skins={serverData.skins}
          skinTypes={serverData.skinTypes}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanstackProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <RecaptchaProvider>
              <AuthProvider serverData={serverData}>
                <OrderProvider>
                  <ServerDataProvider data={serverData}>
                    <FilterWrapper skins={serverData.skins}>
                      <SidebarProvider
                        key="sidebar-provider"
                        defaultOpen={sidebarOpen}
                      >
                        <AppSidebar serverUserData={serverData} />
                        <SidebarInset>
                          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                              <SidebarTrigger className="-ml-1" />
                              <Separator
                                orientation="vertical"
                                className="mr-2 h-4"
                              />
                              <BreadcrumbNav />
                            </div>
                            <div className="flex items-center gap-2 px-4">
                              <CartButton />
                              <ThemeToggle />
                            </div>
                          </header>
                          {children}
                        </SidebarInset>
                      </SidebarProvider>
                    </FilterWrapper>
                  </ServerDataProvider>
                </OrderProvider>
              </AuthProvider>
            </RecaptchaProvider>
          </ThemeProvider>
        </TanstackProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
