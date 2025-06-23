'use client'

// import { useSearchParams } from 'next/navigation'
import { FilterProvider } from '@/context/FilterContext'
import { Skin } from '@/lib/types/skin'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <FilterProviderWithParams skins={skins}>
        {children}
      </FilterProviderWithParams>
    </Suspense>
  )
}
