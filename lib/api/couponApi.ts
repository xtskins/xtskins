import { createClient } from '@/lib/supabase/client'
import type {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  ApiResponse,
} from '@/lib/types/coupon'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

export const couponApi = {
  // Listar todos os cupons (admin)
  async getAllCoupons(): Promise<ApiResponse<Coupon[]>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/coupons', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar cupons')
    }

    return data
  },

  // Buscar cupom específico
  async getCoupon(couponId: string): Promise<ApiResponse<Coupon>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/admin/coupons/${couponId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar cupom')
    }

    return data
  },

  // Criar novo cupom
  async createCoupon(
    couponData: CreateCouponInput,
  ): Promise<ApiResponse<Coupon>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(couponData),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao criar cupom')
    }

    return data
  },

  // Atualizar cupom
  async updateCoupon(
    couponId: string,
    couponData: UpdateCouponInput,
  ): Promise<ApiResponse<Coupon>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/admin/coupons/${couponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(couponData),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao atualizar cupom')
    }

    return data
  },

  // Deletar cupom
  async deleteCoupon(couponId: string): Promise<ApiResponse<void>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/admin/coupons/${couponId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao deletar cupom')
    }

    return data
  },
}
