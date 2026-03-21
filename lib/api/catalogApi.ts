import { createClient } from '@/lib/supabase/client'
import type {
  CatalogItemRow,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '@/lib/types/catalog'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('No access token')
  return accessToken
}

interface ApiOk<T> {
  success: true
  data: T
}

export const catalogApi = {
  async listAll(): Promise<ApiOk<CatalogItemRow[]>> {
    const accessToken = await getAccessToken()
    const response = await fetch('/api/v1/admin/catalog', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao listar catálogo')
    }
    return data
  },

  async create(
    body: CreateCatalogItemInput,
  ): Promise<ApiOk<CatalogItemRow>> {
    const accessToken = await getAccessToken()
    const response = await fetch('/api/v1/admin/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao criar item')
    }
    return data
  },

  async update(
    catalogId: string,
    body: UpdateCatalogItemInput,
  ): Promise<ApiOk<CatalogItemRow>> {
    const accessToken = await getAccessToken()
    const response = await fetch(`/api/v1/admin/catalog/${catalogId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha ao atualizar item')
    }
    return data
  },
}
