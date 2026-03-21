import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogApi } from '@/lib/api/catalogApi'
import type {
  CatalogItemRow,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '@/lib/types/catalog'
import { invalidateSkinsServerCache } from '@/lib/server/actions/invalidate-cache'

export function useCatalogItems() {
  return useQuery({
    queryKey: ['admin-catalog'],
    queryFn: async () => {
      const res = await catalogApi.listAll()
      return res.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCatalogMutations() {
  const queryClient = useQueryClient()

  const invalidateStorefront = async () => {
    await invalidateSkinsServerCache()
    queryClient.invalidateQueries({ queryKey: ['admin-catalog'] })
  }

  const createMutation = useMutation({
    mutationFn: (body: CreateCatalogItemInput) => catalogApi.create(body),
    onSuccess: () => {
      void invalidateStorefront()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: UpdateCatalogItemInput
    }) => catalogApi.update(id, body),
    onSuccess: () => {
      void invalidateStorefront()
    },
  })

  return { createMutation, updateMutation }
}

export function useSteamCatalogSearch(debouncedQuery: string) {
  return useQuery({
    queryKey: ['admin-catalog-steam-search', debouncedQuery],
    queryFn: async () => {
      const res = await catalogApi.searchSteam(debouncedQuery)
      return res.data
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 60_000,
  })
}

export function useImportSteamCatalog() {
  const queryClient = useQueryClient()

  const invalidateStorefront = async () => {
    await invalidateSkinsServerCache()
    queryClient.invalidateQueries({ queryKey: ['admin-catalog'] })
  }

  return useMutation({
    mutationFn: (markethashname: string) =>
      catalogApi.importFromSteam(markethashname),
    onSuccess: (result) => {
      if (result.ok) void invalidateStorefront()
    },
  })
}

export type { CatalogItemRow }
