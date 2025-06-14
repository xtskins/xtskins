import { ApiResponse, Skin, SkinType } from '@/lib/types/skin'

export const skinsApi = {
  async getSkins(): Promise<ApiResponse<Skin[]>> {
    const response = await fetch('/api/v1/skins')

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao buscar skins')

    return data
  },

  async getSkinTypes(): Promise<ApiResponse<SkinType[]>> {
    const response = await fetch('/api/v1/skins/types')

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao buscar tipos de skins')

    return data
  },
}
