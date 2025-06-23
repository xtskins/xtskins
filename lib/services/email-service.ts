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
    console.log('📧 [EMAIL SERVICE DEBUG] Iniciando envio de email:', {
      firstName,
      email,
      isNewUser,
    })

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    console.log('🔑 [EMAIL SERVICE DEBUG] Token de acesso:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
    })

    if (!accessToken) {
      throw new Error('No access token available')
    }

    console.log('📡 [EMAIL SERVICE DEBUG] Fazendo requisição para API...')
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

    console.log('📨 [EMAIL SERVICE DEBUG] Resposta da API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ [EMAIL SERVICE DEBUG] Erro na resposta:', error)
      throw new Error(error.error || 'Erro ao enviar email')
    }

    const result = await response.json()
    console.log('✅ [EMAIL SERVICE DEBUG] Email enviado com sucesso:', result)
    return result
  } catch (error) {
    console.error(
      '❌ [EMAIL SERVICE DEBUG] Erro ao enviar email de boas-vindas:',
      error,
    )
    throw error
  }
}
