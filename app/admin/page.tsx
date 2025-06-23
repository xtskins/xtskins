'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminSkins } from '@/hooks/useAdminSkins'
import { useSteamAuthCheck } from '@/hooks/useSteamAuthCheck'
import { useFilter, FilterProvider } from '@/context/FilterContext'
import { cn } from '@/lib/utils'
import AdminSkinCard from '@/components/AdminSkinCard'
import SteamAuthDialog from '@/components/SteamAuthDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminPaginationControls } from '@/components/AdminPagination'
import UpdateInventoryDialog from '@/components/UpdateInventoryDialog'

function StatusDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          color,
        )}
      />
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', color)}
      />
    </span>
  )
}

function AdminPageContent() {
  const router = useRouter()
  const [showSteamAuthDialog, setShowSteamAuthDialog] = useState(false)
  const [steamAuthRequired, setSteamAuthRequired] = useState(false)
  const queryClient = useQueryClient()

  const { filteredSkins, paginatedSkins, activeFilterText, paginationState } =
    useFilter()

  const {
    data: steamAuthCheck,
    isLoading: isCheckingAuth,
    error: authError,
  } = useSteamAuthCheck()

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
          <div className="mb-6 space-y-3">
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold truncate">
                  Painel de Administração
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie suas skins, edite o preço e a visibilidade de cada
                  uma.
                </p>
              </div>
              <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:gap-4 lg:space-y-0">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-center lg:justify-start">
                  <Skeleton className="h-9 w-32 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold truncate">
                  Painel de Administração
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie suas skins, edite o preço e a visibilidade de cada
                  uma.
                </p>
              </div>
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

  if (filteredSkins.length === 0 && activeFilterText) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
        <div className="z-10 flex h-full w-full max-w-7xl flex-col">
          <div className="mb-6 space-y-3">
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold truncate">
                  Painel de Administração
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie suas skins, edite o preço e a visibilidade de cada
                  uma.
                </p>
              </div>
              <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:gap-4 lg:space-y-0">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <StatusDot color="bg-green-500" />
                  Visíveis:{' '}
                  {filteredSkins.filter((skin) => skin.is_visible).length}
                  <StatusDot color="bg-red-500" />
                  Ocultas:{' '}
                  {filteredSkins.filter((skin) => !skin.is_visible).length}
                </div>
                <div className="flex justify-center lg:justify-start">
                  <UpdateInventoryDialog />
                </div>
              </div>
            </div>
          </div>

          {steamAuthCheck && steamAuthCheck.hasRefreshToken && (
            <div className="mb-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <div className="flex items-center gap-2 text-sm">
                  <StatusDot color="bg-green-500" />
                  <span className="text-green-700 dark:text-green-300">
                    Steam configurado - Atualização automática ativa
                  </span>
                </div>
              </div>
            </div>
          )}

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
        <div className="mb-6 space-y-3">
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold truncate">
                Painel de Administração
              </h1>
              <p className="text-muted-foreground text-sm">
                Gerencie suas skins, edite o preço e a visibilidade de cada uma.
              </p>
            </div>
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:gap-4 lg:space-y-0">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <StatusDot color="bg-green-500" />
                Visíveis:{' '}
                {filteredSkins.filter((skin) => skin.is_visible).length}
                <StatusDot color="bg-red-500" />
                Ocultas:{' '}
                {filteredSkins.filter((skin) => !skin.is_visible).length}
              </div>
              <div className="flex justify-center lg:justify-start">
                <UpdateInventoryDialog />
              </div>
            </div>
          </div>
        </div>

        {steamAuthCheck && steamAuthCheck.hasRefreshToken && (
          <div className="mb-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2 text-sm">
                <StatusDot color="bg-green-500" />
                <span className="text-green-700 dark:text-green-300">
                  Steam configurado - Atualização automática ativa
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {activeFilterText ? (
              <>
                {activeFilterText} ({filteredSkins.length})
              </>
            ) : (
              <>Minhas Skins ({filteredSkins.length})</>
            )}
          </h3>
          {activeFilterText && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Filtro ativo: {activeFilterText}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedSkins.map((skin) => (
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

        {paginationState.totalItems > paginationState.itemsPerPage && (
          <AdminPaginationControls
            currentPage={paginationState.currentPage}
            totalPages={paginationState.totalPages}
            totalItems={paginationState.totalItems}
            itemsPerPage={paginationState.itemsPerPage}
          />
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { data: skins, isLoading, error } = useAdminSkins()

  if (isLoading) {
    return (
      <div className="bg-background relative flex w-full flex-col items-center overflow-hidden p-4">
        <div className="z-10 flex h-full w-full max-w-7xl flex-col">
          <div className="mb-6 space-y-3">
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold truncate">
                  Painel de Administração
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie suas skins, edite o preço e a visibilidade de cada
                  uma.
                </p>
              </div>
              <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:gap-4 lg:space-y-0">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-center lg:justify-start">
                  <Skeleton className="h-9 w-32 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

  if (!skins) {
    return null
  }

  return (
    <Suspense fallback={<div className="p-4">Carregando filtros...</div>}>
      <FilterProvider skins={skins}>
        <AdminPageContent />
      </FilterProvider>
    </Suspense>
  )
}
