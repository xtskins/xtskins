import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventoryApi'
import { invalidateSkinsServerCache } from '@/lib/server/actions/invalidate-cache'

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
    onSuccess: async (data, variables) => {
      console.log('Inventário atualizado com sucesso:', data)

      // Invalidar queries relacionadas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['skins'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['admin-skins'] })

      // Invalidar cache server-side para que as alterações sejam visíveis para todos os usuários
      try {
        console.log(
          '🔄 Invalidando cache server-side após atualização da skin...',
        )
        await invalidateSkinsServerCache()
        console.log('✅ Cache server-side invalidado com sucesso')
      } catch (cacheError) {
        console.error('⚠️ Erro ao invalidar cache server-side:', cacheError)
        // Não falha a operação se o cache falhar
      }

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
