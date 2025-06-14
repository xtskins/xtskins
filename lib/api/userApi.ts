import { createClient } from '@/lib/supabase/client'
import { ApiResponse, User } from '@/lib/types/user'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

export const userApi = {
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    const accessToken = await getAccessToken()

    const response = await fetch(`/api/v1/user/get-profile?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success)
      throw new Error(data.error?.message || 'Falha ao buscar perfil')

    return data
  },
}
