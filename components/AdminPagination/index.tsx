'use client'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface AdminPaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

export function AdminPaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  showItemsPerPage = true,
  itemsPerPageOptions = [12, 24, 36, 48],
}: AdminPaginationControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateURL = (page: number, limit?: number) => {
    const params = new URLSearchParams(searchParams.toString())

    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }

    if (limit && limit !== itemsPerPageOptions[0]) {
      params.set('limit', limit.toString())
    } else if (limit) {
      params.delete('limit')
    }

    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.replace(newUrl, { scroll: false })
  }

  const goToPage = (page: number) => {
    updateURL(page)
  }

  const setItemsPerPage = (items: number) => {
    updateURL(1, items)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  // Se não há itens suficientes para paginar, não mostra a paginação
  if (totalItems <= itemsPerPageOptions[0]) {
    return null
  }

  // Gera os números das páginas para mostrar
  const generatePageNumbers = () => {
    const pages = []
    const showPages = 5 // Quantidade de páginas para mostrar

    if (totalPages <= showPages) {
      // Se tem poucas páginas, mostra todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas com ellipsis
      if (currentPage <= 3) {
        // Início
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Fim
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Meio
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Informações sobre os itens */}
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} skins
      </div>

      {/* Paginação */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={prevPage}
              className={
                currentPage === 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => goToPage(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={nextPage}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Seletor de itens por página */}
      {showItemsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Itens por página:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value: string) =>
              setItemsPerPage(parseInt(value, 10))
            }
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
