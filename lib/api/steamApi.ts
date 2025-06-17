import { createClient } from '@/lib/supabase/client'

async function getAccessToken() {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) throw new Error('No access token')
  return accessToken
}

interface QRAuthResponse {
  success: boolean
  data?: {
    sessionId: string
    qrUrl: string
    message: string
  }
  error?: {
    message: string
    code: string
  }
}

interface AuthStatusResponse {
  success: boolean
  data?: {
    status: 'pending' | 'completed'
    authenticated: boolean
  }
  error?: {
    message: string
    code: string
  }
}

interface SteamAuthResponse {
  success: boolean
  data?: {
    steamLoginSecure?: string
    hasRefreshToken: boolean
  }
  error?: {
    message: string
    code: string
  }
}

interface SteamAuthCheckResponse {
  success: boolean
  data?: {
    hasRefreshToken: boolean
    configured: boolean
    lastUpdated: string | null
  }
  error?: {
    message: string
    code: string
  }
}

export const steamApi = {
  async startQRAuth(): Promise<QRAuthResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/steam-auth/qr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(
        data.error?.message || 'Erro ao iniciar autenticação Steam',
      )
    }

    return data
  },

  async checkAuthStatus(sessionId: string): Promise<AuthStatusResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch(
      `/api/v1/admin/steam-auth/qr?sessionId=${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao verificar status')
    }

    return data
  },

  async checkSteamAuth(): Promise<SteamAuthCheckResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/steam-auth/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao verificar steam auth')
    }

    return data
  },

  async getSteamAuth(): Promise<SteamAuthResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/steam-auth', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao obter steam auth')
    }

    return data
  },

  async removeSteamAuth(): Promise<{ success: boolean }> {
    const accessToken = await getAccessToken()

    const response = await fetch('/api/v1/admin/steam-auth', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao remover steam auth')
    }

    return data
  },
}
