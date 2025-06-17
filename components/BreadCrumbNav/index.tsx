'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getBreadcrumbsForPath, routes } from '@/lib/config/routes'
import { useFilter } from '@/context/FilterContext'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function BreadcrumbNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { activeFilterText, clearFilters } = useFilter()
  const breadcrumbs = getBreadcrumbsForPath(pathname)

  const prefetchChildRoutes = React.useCallback(
    (parentKey: string) => {
      const childRoutes = Object.values(routes).filter(
        (route) => route.parent === parentKey,
      )

      childRoutes.forEach((route) => {
        router.prefetch(route.path)
      })
    },
    [router],
  )

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const routeKey = Object.keys(routes).find(
            (key) => routes[key].path === crumb.path,
          )

          return (
            <React.Fragment key={crumb.path}>
              <BreadcrumbItem className="hidden md:block">
                {isLast && !activeFilterText ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <div
                    onMouseEnter={() => {
                      if (routeKey) {
                        prefetchChildRoutes(routeKey)
                      }
                    }}
                  >
                    <BreadcrumbLink asChild>
                      <Link href={crumb.path} prefetch={true}>
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  </div>
                )}
              </BreadcrumbItem>
              {(!isLast || activeFilterText) && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </React.Fragment>
          )
        })}

        {activeFilterText && (
          <BreadcrumbItem className="hidden md:block">
            <div className="flex items-center gap-2">
              <BreadcrumbPage>{activeFilterText}</BreadcrumbPage>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-4 w-4 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
                title="Limpar filtro"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
