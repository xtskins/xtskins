import { useMutation } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventoryApi'

interface SyncInventoryVariables {
  steamLoginSecure?: string
  forceRefresh?: boolean
}

export function useSyncInventory() {
  return useMutation({
    mutationFn: ({ steamLoginSecure, forceRefresh }: SyncInventoryVariables) =>
      inventoryApi.syncInventory(steamLoginSecure, forceRefresh),
    onSuccess: (data) => {
      console.log('Inventário sincronizado com sucesso:', data)
    },
    onError: (error) => {
      console.error('Erro ao sincronizar inventário:', error)
    },
  })
}
