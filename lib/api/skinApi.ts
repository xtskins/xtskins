import { createClient } from '@/lib/supabase/client'
import { ApiResponse, ExternalSkinData, Skin } from '@/lib/types/skin'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

export const skinApi = {
  async saveSkins(
    skins: ExternalSkinData[],
    steamId?: string,
  ): Promise<ApiResponse<Skin[]>> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/skin/save-skins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ skins, steamId }),
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao salvar skins')

    return data
  },

  async fetchInventory(
    steamId: string,
    steamLoginSecure: string,
  ): Promise<
    ApiResponse<{
      message: string
      totalSkins: number
      savedSkins: number
      skins: Skin[]
    }>
  > {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/skin/fetch-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ steamId, steamLoginSecure }),
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao buscar inventário')

    return data
  },
}
