import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api/userApi'
import { toast } from 'sonner'

export function useUpdateSteamId() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (steamId: string) => userApi.updateSteamId(steamId),
    onSuccess: () => {
      toast.success('Steam ID salvo com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar Steam ID')
    },
  })
}
