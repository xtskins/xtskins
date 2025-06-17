import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventoryApi'

export function useAdminSkins() {
  return useQuery({
    queryKey: ['admin-skins'],
    queryFn: () => inventoryApi.getAdminSkins(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    select: (data) => data.data || [],
  })
}
