'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  invalidateSkinsServerCache,
  forceRefreshSkinsCache,
} from '@/lib/server/actions/invalidate-cache'
import { toast } from 'sonner'

export function useSkinsCache() {
  const queryClient = useQueryClient()

  const invalidateCacheMutation = useMutation({
    mutationFn: invalidateSkinsServerCache,
    onSuccess: (result) => {
      if (result.success) {
        // Invalida as queries relacionadas no cliente
        queryClient.invalidateQueries({ queryKey: ['skins'] })
        queryClient.invalidateQueries({ queryKey: ['admin-skins'] })

        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      console.error('Erro ao invalidar cache:', error)
      toast.error('Erro ao invalidar cache das skins')
    },
  })

  const refreshCacheMutation = useMutation({
    mutationFn: forceRefreshSkinsCache,
    onSuccess: (result) => {
      if (result.success) {
        // Invalida as queries relacionadas no cliente
        queryClient.invalidateQueries({ queryKey: ['skins'] })
        queryClient.invalidateQueries({ queryKey: ['admin-skins'] })

        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar cache:', error)
      toast.error('Erro ao atualizar cache das skins')
    },
  })

  return {
    // Invalidar cache sem forçar atualização imediata
    invalidateCache: invalidateCacheMutation.mutateAsync,
    isInvalidating: invalidateCacheMutation.isPending,

    // Forçar atualização do cache
    refreshCache: refreshCacheMutation.mutateAsync,
    isRefreshing: refreshCacheMutation.isPending,

    // Status geral
    isLoading:
      invalidateCacheMutation.isPending || refreshCacheMutation.isPending,
  }
}
