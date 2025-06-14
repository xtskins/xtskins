import { useQuery } from '@tanstack/react-query'
import { skinsApi } from '@/lib/api/skinsApi'
import { Skin, SkinType } from '@/lib/types/skin'

export function useSkins(initialData?: Skin[]) {
  return useQuery({
    queryKey: ['skins'],
    queryFn: () => skinsApi.getSkins(),
    enabled: !initialData,
    initialData: initialData ? { success: true, data: initialData } : undefined,
    select: (data) => data?.data ?? [],
  })
}

export function useSkinTypes(initialData?: SkinType[]) {
  return useQuery({
    queryKey: ['skinTypes'],
    queryFn: () => skinsApi.getSkinTypes(),
    enabled: !initialData,
    initialData: initialData ? { success: true, data: initialData } : undefined,
    select: (data) => data?.data ?? [],
  })
}
