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

export interface SteamCatalogSearchHit {
  markethashname: string
  marketname: string
  image: string
  wear: string
  pricelatestUsd: number | null
  pricerealUsd: number | null
  inCatalog: boolean
}

export type ImportSteamResult =
  | { ok: true; data: CatalogItemRow }
  | {
      ok: false
      status: number
      message: string
      existingId?: string
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

  async searchSteam(q: string): Promise<ApiOk<SteamCatalogSearchHit[]>> {
    const accessToken = await getAccessToken()
    const url = `/api/v1/admin/catalog/steam-search?q=${encodeURIComponent(q)}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Falha na busca Steam')
    }
    return data
  },

  async importFromSteam(
    markethashname: string,
  ): Promise<ImportSteamResult> {
    const accessToken = await getAccessToken()
    const response = await fetch('/api/v1/admin/catalog/import-steam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ markethashname }),
    })
    const json = (await response.json()) as {
      success?: boolean
      data?: CatalogItemRow
      error?: { message?: string; code?: string }
      existingId?: string
    }
    if (json.success && json.data) {
      return { ok: true, data: json.data }
    }
    return {
      ok: false,
      status: response.status,
      message: json.error?.message || 'Falha ao importar',
      existingId: json.existingId,
    }
  },
}
