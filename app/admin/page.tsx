'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminSkins } from '@/hooks/useAdminSkins'
import { useSteamAuthCheck } from '@/hooks/useSteamAuthCheck'
import { useFilter } from '@/context/FilterContext'
import AdminSkinCard from '@/components/AdminSkinCard'
import SteamAuthDialog from '@/components/SteamAuthDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminPaginationControls } from '@/components/AdminPagination'
import UpdateInventoryButton from '@/components/UpdateInventory'

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: skins, isLoading, error } = useAdminSkins()
  const {
    data: steamAuthCheck,
    isLoading: isCheckingAuth,
    error: authError,
  } = useSteamAuthCheck()
  const [showSteamAuthDialog, setShowSteamAuthDialog] = useState(false)
  const [steamAuthRequired, setSteamAuthRequired] = useState(false)
  const queryClient = useQueryClient()
  const { filterState, activeFilterText } = useFilter()

  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = searchParams.get('page')
    return pageFromUrl ? parseInt(pageFromUrl, 10) : 1
  })

  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const limitFromUrl = searchParams.get('limit')
    return limitFromUrl ? parseInt(limitFromUrl, 10) : 12
  })

  useEffect(() => {
    const pageFromUrl = searchParams.get('page')
    const limitFromUrl = searchParams.get('limit')

    setCurrentPage(pageFromUrl ? parseInt(pageFromUrl, 10) : 1)

    setItemsPerPage(limitFromUrl ? parseInt(limitFromUrl, 10) : 12)
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterState.selectedType, filterState.selectedSubType])

  const filteredAdminSkins = useMemo(() => {
    if (!skins) return []

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

  const paginatedAdminSkins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAdminSkins.slice(startIndex, endIndex)
  }, [filteredAdminSkins, currentPage, itemsPerPage])

  const adminPaginationInfo = useMemo(() => {
    const totalItems = filteredAdminSkins.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredAdminSkins.length, currentPage, itemsPerPage])

  useEffect(() => {
    if (steamAuthCheck && !steamAuthCheck.hasRefreshToken) {
      setShowSteamAuthDialog(true)
      setSteamAuthRequired(true)
    } else if (steamAuthCheck && steamAuthCheck.hasRefreshToken) {
      setShowSteamAuthDialog(false)
      setSteamAuthRequired(false)
    }
  }, [steamAuthCheck])

  const handleSteamAuthDialogClose = () => {
    if (steamAuthRequired) {
      router.push('/')
      return
    }

    setShowSteamAuthDialog(false)
    queryClient.invalidateQueries({ queryKey: ['steam-auth-check'] })
  }

  if (isCheckingAuth) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
        <div className="z-10 flex h-full w-full max-w-7xl flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Painel de Administração</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-3 rounded-full ml-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="mb-6">
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex justify-center">
                <div className="space-y-4">
                  <Skeleton className="h-[400px] w-[265px] rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Skeleton className="h-10 w-80 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden">
        <div className="z-10 flex h-full flex-col items-center justify-center max-md:min-h-[30dvh]">
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Erro ao verificar configurações Steam
            </h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {authError instanceof Error
                ? authError.message
                : 'Erro na verificação Steam'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (steamAuthCheck && !steamAuthCheck.hasRefreshToken) {
    return (
      <>
        <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
          <div className="z-10 flex h-full w-full max-w-7xl flex-col items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Painel de Administração</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Configuração Steam necessária para acessar o painel
              </p>
            </div>
          </div>
        </div>

        <SteamAuthDialog
          open={showSteamAuthDialog}
          onClose={handleSteamAuthDialogClose}
          required={steamAuthRequired}
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
        <div className="z-10 flex h-full w-full max-w-7xl flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Painel de Administração</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-3 rounded-full ml-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="mb-6">
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex justify-center">
                <div className="space-y-4">
                  <Skeleton className="h-[400px] w-[265px] rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Skeleton className="h-10 w-80 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden">
        <div className="z-10 flex h-full flex-col items-center justify-center max-md:min-h-[30dvh]">
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Erro ao carregar skins
            </h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (filteredAdminSkins.length === 0 && activeFilterText) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
        <div className="z-10 flex h-full w-full max-w-7xl flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Painel de Administração</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
              Visíveis: {skins?.filter((skin) => skin.is_visible).length || 0}
              <span className="ml-4 flex h-3 w-3 rounded-full bg-red-500"></span>
              Ocultas: {skins?.filter((skin) => !skin.is_visible).length || 0}
            </div>
          </div>

          {steamAuthCheck && steamAuthCheck.hasRefreshToken && (
            <div className="mb-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-green-700 dark:text-green-300">
                    Steam configurado - Atualização automática ativa
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <UpdateInventoryButton />
          </div>

          <div className="flex flex-col items-center justify-center min-h-[30vh]">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Nenhuma skin encontrada para o filtro &ldquo;{activeFilterText}
              &rdquo;
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Tente selecionar outro filtro ou limpe os filtros ativos
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
      <div className="z-10 flex h-full w-full max-w-7xl flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Painel de Administração</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
            Visíveis: {skins?.filter((skin) => skin.is_visible).length || 0}
            <span className="ml-4 flex h-3 w-3 rounded-full bg-red-500"></span>
            Ocultas: {skins?.filter((skin) => !skin.is_visible).length || 0}
          </div>
        </div>

        {steamAuthCheck && steamAuthCheck.hasRefreshToken && (
          <div className="mb-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-green-700 dark:text-green-300">
                  Steam configurado - Atualização automática ativa
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <UpdateInventoryButton />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {activeFilterText ? (
              <>
                {activeFilterText} ({filteredAdminSkins.length})
              </>
            ) : (
              <>Minhas Skins ({filteredAdminSkins.length})</>
            )}
          </h3>
          {activeFilterText && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Filtro ativo: {activeFilterText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {paginatedAdminSkins.map((skin) => (
            <div key={skin.id} className="flex justify-center">
              <AdminSkinCard
                skinData={{
                  ...skin,
                  rarity: skin.rarity || '',
                  color: skin.color || '',
                  inspectlink: skin.inspectlink || '',
                }}
              />
            </div>
          ))}
        </div>

        {adminPaginationInfo.totalItems > itemsPerPage && (
          <AdminPaginationControls
            currentPage={adminPaginationInfo.currentPage}
            totalPages={adminPaginationInfo.totalPages}
            totalItems={adminPaginationInfo.totalItems}
            itemsPerPage={adminPaginationInfo.itemsPerPage}
          />
        )}
      </div>
    </div>
  )
}
