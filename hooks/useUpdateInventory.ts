import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventoryApi'

interface UpdateInventoryVariables {
  skinId: string
  updates: {
    discount_price?: string
    is_visible?: boolean
  }
}

export function useUpdateInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ skinId, updates }: UpdateInventoryVariables) =>
      inventoryApi.updateInventory(skinId, updates),
    onSuccess: (data, variables) => {
      console.log('Inventário atualizado com sucesso:', data)

      // Invalidar queries relacionadas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['skins'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['admin-skins'] })

      // Opcionalmente, atualizar a skin específica no cache
      if (data.data) {
        queryClient.setQueryData(['skin', variables.skinId], data.data)
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar inventário:', error)
    },
  })
}
