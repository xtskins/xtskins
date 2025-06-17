'use client'

import SkinCard from '@/components/SkinCard'
import { DotPattern } from '@/components/ui/dot-pattern'
import { useFilter } from '@/context/FilterContext'
import { PaginationControls } from '@/components/Pagination'
import { cn } from '@/lib/utils'

export default function Page() {
  const { paginatedSkins } = useFilter()

  if (!paginatedSkins || paginatedSkins.length === 0) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden h-full">
        <div className="z-10 flex h-full flex-col items-center justify-center max-md:min-h-[30dvh]">
          <p>Nenhuma skin encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4 h-full">
      <div className="z-10 flex h-full w-full max-w-7xl flex-col">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedSkins.map((skin) => (
            <div key={skin.id} className="flex justify-center">
              <SkinCard skinData={skin} />
            </div>
          ))}
        </div>
        <PaginationControls />
      </div>
      <DotPattern
        className={cn(
          '[mask-image:radial-gradient(200px_circle_at_center,white,transparent)] md:[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] lg:[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
        )}
      />
    </div>
  )
}
