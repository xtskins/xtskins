'use client'

import { useFilter } from '@/context/FilterContext'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function FilterDisplay() {
  const { activeFilterText, clearFilters } = useFilter()

  if (!activeFilterText) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-sm">
        <span>Filtro: {activeFilterText}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-4 w-4 p-0 hover:bg-transparent"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
