import { createClient } from '@/lib/supabase/client'
import { ApiResponse, Skin } from '@/lib/types/skin'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

export const inventoryApi = {
  async syncInventory(
    steamLoginSecure?: string,
    forceRefresh?: boolean,
  ): Promise<
    ApiResponse<{
      message: string
      totalSkins: number
      savedSkins: number
      deletedSkins: number
      skins: Skin[]
    }>
  > {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/inventory/fetch-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ steamLoginSecure, forceRefresh }),
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao sincronizar inventário')

    return data
  },

  async updateInventory(
    skinId: string,
    updates: {
      discount_price?: string
      is_visible?: boolean
    },
  ): Promise<ApiResponse<Skin>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/inventory/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ skinId, ...updates }),
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao atualizar inventário')

    return data
  },

  async getAdminSkins(): Promise<ApiResponse<Skin[]>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/inventory/admin-skins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao buscar skins do admin')

    return data
  },
}
