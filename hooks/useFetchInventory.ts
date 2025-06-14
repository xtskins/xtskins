import { useMutation } from '@tanstack/react-query'
import { skinApi } from '@/lib/api/skinApi'

interface FetchInventoryVariables {
  steamId: string
  steamLoginSecure: string
}

export function useFetchInventory() {
  return useMutation({
    mutationFn: ({ steamId, steamLoginSecure }: FetchInventoryVariables) =>
      skinApi.fetchInventory(steamId, steamLoginSecure),
    onSuccess: (data) => {
      console.log('Inventário carregado com sucesso:', data)
    },
    onError: (error) => {
      console.error('Erro ao carregar inventário:', error)
    },
  })
}
