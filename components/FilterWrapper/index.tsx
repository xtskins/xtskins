'use client'

// import { useSearchParams } from 'next/navigation'
import { FilterProvider } from '@/context/FilterContext'
import { Skin } from '@/lib/types/skin'
import { Suspense } from 'react'

interface FilterWrapperProps {
  children: React.ReactNode
  skins: Skin[]
}

function FilterProviderWithParams({ children, skins }: FilterWrapperProps) {
  // Este componente irá acessar useSearchParams
  return <FilterProvider skins={skins}>{children}</FilterProvider>
}

export function FilterWrapper({ children, skins }: FilterWrapperProps) {
  return (
    <Suspense fallback={<div className="p-4">Carregando filtros...</div>}>
      <FilterProviderWithParams skins={skins}>
        {children}
      </FilterProviderWithParams>
    </Suspense>
  )
}
