import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { steamApi } from '@/lib/api/steamApi'

export function useSteamAuth() {
  return useQuery({
    queryKey: ['steam-auth'],
    queryFn: () => steamApi.getSteamAuth(),
    select: (data) => data?.data ?? null,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: 1,
  })
}

export function useSteamAuthActions() {
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: () => steamApi.removeSteamAuth(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steam-auth'] })
    },
  })

  return {
    removeSteamAuth: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  }
}
