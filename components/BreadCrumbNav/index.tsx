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

export function BreadcrumbNav() {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumbs = getBreadcrumbsForPath(pathname)

  // Função para prefetch das rotas filhas
  const prefetchChildRoutes = React.useCallback(
    (parentKey: string) => {
      // Encontra todas as rotas que têm este item como parent
      const childRoutes = Object.values(routes).filter(
        (route) => route.parent === parentKey,
      )

      // Prefetch cada rota filha
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
                {isLast ? (
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
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
