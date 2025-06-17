'use client'

import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Skin } from '@/lib/types/skin'

interface FilterState {
  selectedType: string | null
  selectedSubType: string | null
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

interface FilterContextType {
  filterState: FilterState
  paginationState: PaginationState
  setFilter: (type: string | null, subType: string | null) => void
  clearFilters: () => void
  filteredSkins: Skin[]
  paginatedSkins: Skin[]
  activeFilterText: string | null
  goToPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  nextPage: () => void
  prevPage: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

interface FilterProviderProps {
  children: React.ReactNode
  skins: Skin[]
  defaultItemsPerPage?: number
}

export function FilterProvider({
  children,
  skins,
  defaultItemsPerPage = 12,
}: FilterProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filterState, setFilterState] = useState<FilterState>(() => {
    const typeFromUrl = searchParams.get('type')
    const subTypeFromUrl = searchParams.get('subtype')

    return {
      selectedType: typeFromUrl,
      selectedSubType: subTypeFromUrl,
    }
  })

  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = searchParams.get('page')
    return pageFromUrl ? parseInt(pageFromUrl, 10) : 1
  })

  const [itemsPerPage, setItemsPerPageState] = useState(() => {
    const limitFromUrl = searchParams.get('limit')
    return limitFromUrl ? parseInt(limitFromUrl, 10) : defaultItemsPerPage
  })

  const updateURL = (
    type: string | null,
    subType: string | null,
    page: number = 1,
    limit: number = itemsPerPage,
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    if (type && subType) {
      params.set('type', type)
      params.set('subtype', subType)
    } else {
      params.delete('type')
      params.delete('subtype')
    }

    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }

    if (limit !== defaultItemsPerPage) {
      params.set('limit', limit.toString())
    } else {
      params.delete('limit')
    }

    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.replace(newUrl, { scroll: false })
  }

  const setFilter = (type: string | null, subType: string | null) => {
    setFilterState({
      selectedType: type,
      selectedSubType: subType,
    })
    setCurrentPage(1)
    updateURL(type, subType, 1, itemsPerPage)
  }

  const clearFilters = () => {
    setFilterState({
      selectedType: null,
      selectedSubType: null,
    })
    setCurrentPage(1)
    updateURL(null, null, 1, itemsPerPage)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    updateURL(
      filterState.selectedType,
      filterState.selectedSubType,
      page,
      itemsPerPage,
    )
  }

  const setItemsPerPage = (items: number) => {
    setItemsPerPageState(items)
    setCurrentPage(1)
    updateURL(filterState.selectedType, filterState.selectedSubType, 1, items)
  }

  const nextPage = () => {
    const nextPageNumber = currentPage + 1
    const maxPages = Math.ceil(filteredSkins.length / itemsPerPage)
    if (nextPageNumber <= maxPages) {
      goToPage(nextPageNumber)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  useEffect(() => {
    const typeFromUrl = searchParams.get('type')
    const subTypeFromUrl = searchParams.get('subtype')
    const pageFromUrl = searchParams.get('page')
    const limitFromUrl = searchParams.get('limit')

    setFilterState({
      selectedType: typeFromUrl,
      selectedSubType: subTypeFromUrl,
    })

    if (pageFromUrl) {
      setCurrentPage(parseInt(pageFromUrl, 10))
    }

    if (limitFromUrl) {
      setItemsPerPageState(parseInt(limitFromUrl, 10))
    }
  }, [searchParams])

  const filteredSkins = useMemo(() => {
    if (!filterState.selectedType && !filterState.selectedSubType) {
      return skins
    }

    return skins.filter((skin) => {
      const typeMatch =
        !filterState.selectedType ||
        (skin.type &&
          skin.type.toLowerCase() === filterState.selectedType?.toLowerCase())

      const subTypeMatch =
        !filterState.selectedSubType ||
        (skin.sub_type &&
          skin.sub_type.toLowerCase() ===
            filterState.selectedSubType?.toLowerCase())

      return typeMatch && subTypeMatch
    })
  }, [skins, filterState])

  const paginatedSkins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSkins.slice(startIndex, endIndex)
  }, [filteredSkins, currentPage, itemsPerPage])

  const paginationState = useMemo(() => {
    const totalItems = filteredSkins.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredSkins.length, itemsPerPage, currentPage])

  const activeFilterText = useMemo(() => {
    if (filterState.selectedSubType) {
      return filterState.selectedSubType
    }
    if (filterState.selectedType) {
      return filterState.selectedType
    }
    return null
  }, [filterState])

  const value = {
    filterState,
    paginationState,
    setFilter,
    clearFilters,
    filteredSkins,
    paginatedSkins,
    activeFilterText,
    goToPage,
    setItemsPerPage,
    nextPage,
    prevPage,
  }

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}
