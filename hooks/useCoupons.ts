import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponApi } from '@/lib/api/couponApi'
import { CreateCouponInput, UpdateCouponInput } from '@/lib/types/coupon'

// Hook para buscar todos os cupons (admin)
export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponApi.getAllCoupons(),
    select: (data) => data?.data ?? [],
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  })
}

// Hook para buscar um cupom específico
export function useCoupon(couponId: string | undefined) {
  return useQuery({
    queryKey: ['coupons', couponId],
    queryFn: () => (couponId ? couponApi.getCoupon(couponId) : null),
    enabled: !!couponId,
    select: (data) => data?.data ?? null,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para ações de cupons
export function useCouponActions() {
  const queryClient = useQueryClient()

  const createCouponMutation = useMutation({
    mutationFn: (couponData: CreateCouponInput) =>
      couponApi.createCoupon(couponData),
    onSuccess: () => {
      // Invalidar queries relacionadas a cupons
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  const updateCouponMutation = useMutation({
    mutationFn: ({
      couponId,
      couponData,
    }: {
      couponId: string
      couponData: UpdateCouponInput
    }) => couponApi.updateCoupon(couponId, couponData),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas a cupons
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      // Atualizar cache do cupom específico
      queryClient.setQueryData(['coupons', variables.couponId], data)
    },
  })

  const deleteCouponMutation = useMutation({
    mutationFn: (couponId: string) => couponApi.deleteCoupon(couponId),
    onSuccess: () => {
      // Invalidar queries relacionadas a cupons
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  return {
    createCoupon: createCouponMutation.mutateAsync,
    updateCoupon: updateCouponMutation.mutateAsync,
    deleteCoupon: deleteCouponMutation.mutateAsync,
    isCreating: createCouponMutation.isPending,
    isUpdating: updateCouponMutation.isPending,
    isDeleting: deleteCouponMutation.isPending,
  }
}
