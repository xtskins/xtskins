import { useQuery } from '@tanstack/react-query'
import { steamApi } from '@/lib/api/steamApi'

export function useSteamAuthCheck() {
  return useQuery({
    queryKey: ['steam-auth-check'],
    queryFn: async () => {
      const response = await steamApi.checkSteamAuth()
      return response.data
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
