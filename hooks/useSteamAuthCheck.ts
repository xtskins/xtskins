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
    // Curto: após configurar Steam via QR o /check precisa refletir rápido no painel.
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })
}
