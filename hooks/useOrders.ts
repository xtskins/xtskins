import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/lib/api/orderApi'
import { CreateOrderInput, UpdateOrderStatusInput } from '@/lib/types/order'

// Hook para buscar pedidos do usuário
export function useUserOrders() {
  return useQuery({
    queryKey: ['orders', 'user'],
    queryFn: () => orderApi.getUserOrders(),
    select: (data) => data?.data ?? [],
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  })
}

// Hook para buscar um pedido específico
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => (orderId ? orderApi.getOrder(orderId) : null),
    enabled: !!orderId,
    select: (data) => data?.data ?? null,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar todos os pedidos (admin)
export function useAllOrders() {
  return useQuery({
    queryKey: ['orders', 'all'],
    queryFn: () => orderApi.getAllOrders(),
    select: (data) => data?.data ?? [],
    staleTime: 1000 * 60 * 2, // 2 minutos para admin
    gcTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para ações de pedidos
export function useOrderActions() {
  const queryClient = useQueryClient()

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderInput) =>
      orderApi.createOrder(orderData),
    onSuccess: () => {
      // Invalidar queries relacionadas a pedidos
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      statusData,
    }: {
      orderId: string
      statusData: UpdateOrderStatusInput
    }) => orderApi.updateOrderStatus(orderId, statusData),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas a pedidos
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Atualizar cache do pedido específico
      queryClient.setQueryData(['orders', variables.orderId], data)
    },
  })

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderApi.cancelOrder(orderId),
    onSuccess: (data, orderId) => {
      // Invalidar queries relacionadas a pedidos
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Atualizar cache do pedido específico
      queryClient.setQueryData(['orders', orderId], data)
    },
  })

  const validateCouponMutation = useMutation({
    mutationFn: ({
      couponCode,
      orderAmount,
    }: {
      couponCode: string
      orderAmount?: number
    }) => orderApi.validateCoupon(couponCode, orderAmount),
  })

  return {
    createOrder: createOrderMutation.mutateAsync,
    updateOrderStatus: updateOrderStatusMutation.mutateAsync,
    cancelOrder: cancelOrderMutation.mutateAsync,
    validateCoupon: validateCouponMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isCanceling: cancelOrderMutation.isPending,
    isValidatingCoupon: validateCouponMutation.isPending,
  }
}
