import { createClient } from '@/lib/supabase/client'
import {
  ApiResponse,
  Order,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from '@/lib/types/order'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

export const orderApi = {
  // Criar um novo pedido
  async createOrder(orderData: CreateOrderInput): Promise<ApiResponse<Order>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao criar pedido')
    }

    return data
  },

  // Buscar pedidos do usuário
  async getUserOrders(): Promise<ApiResponse<Order[]>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/orders/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar pedidos')
    }

    return data
  },

  // Buscar um pedido específico
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar pedido')
    }

    return data
  },

  // Atualizar status do pedido (apenas admins)
  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusInput,
  ): Promise<ApiResponse<Order>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(statusData),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(
        data.error?.message || 'Falha ao atualizar status do pedido',
      )
    }

    return data
  },

  // Buscar todos os pedidos (apenas admins)
  async getAllOrders(): Promise<ApiResponse<Order[]>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/orders/admin', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar todos os pedidos')
    }

    return data
  },

  // Cancelar pedido
  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao cancelar pedido')
    }

    return data
  },

  // Validar cupom
  async validateCoupon(
    couponCode: string,
    orderAmount?: number,
    recaptchaToken?: string,
  ): Promise<
    ApiResponse<{
      coupon_id: string
      discount_type: string
      discount_value: number
      discount_amount: number
      max_discount?: number
    }>
  > {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/orders/validate-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        couponCode,
        orderAmount: orderAmount || 0,
        recaptcha_token: recaptchaToken,
      }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao validar cupom')
    }

    return data
  },
}
