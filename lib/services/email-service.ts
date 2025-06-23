import { createClient } from '@/lib/supabase/client'

interface SendWelcomeEmailParams {
  firstName: string
  email: string
  isNewUser: boolean
}

export async function sendWelcomeEmail({
  firstName,
  email,
  isNewUser,
}: SendWelcomeEmailParams) {
  try {
    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        firstName,
        email,
        isNewUser,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(error)
      throw new Error(error.error || 'Erro ao enviar email')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}
