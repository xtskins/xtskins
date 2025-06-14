import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/lib/api/userApi'
import { User } from '@/lib/types/user'

export function useUser(userId: string | undefined, initialData?: User) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => (userId ? userApi.getProfile(userId) : null),
    enabled: !!userId && !initialData,
    initialData: initialData ? { success: true, data: initialData } : undefined,
    select: (data) => data?.data ?? null,
  })
}
