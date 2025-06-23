import { useEffect, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/lib/types/user'
import { sendWelcomeEmail } from '@/lib/services/email-service'

interface UseWelcomeEmailProps {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
}

export function useWelcomeEmail({
  user,
  profile,
  loading,
}: UseWelcomeEmailProps) {
  const emailSentRef = useRef(false)

  useEffect(() => {
    // Função para enviar email de boas-vindas
    const handleWelcomeEmail = async () => {
      if (
        !user ||
        !profile ||
        loading ||
        emailSentRef.current ||
        profile.welcome_email_sent
      ) {
        return
      }

      console.log('🔍 [WELCOME EMAIL] Verificando necessidade de envio para:', {
        userId: user.id,
        email: user.email,
        name: profile.name,
        welcomeEmailSent: profile.welcome_email_sent,
      })

      try {
        emailSentRef.current = true // Previne múltiplas execuções

        await sendWelcomeEmail({
          firstName: profile.name.split(' ')[0], // Primeiro nome
          email: user.email || '',
          isNewUser: !profile.welcome_email_sent,
        })

        console.log(
          '✅ [WELCOME EMAIL] Email enviado com sucesso para:',
          user.email,
        )
      } catch (error) {
        console.error('❌ [WELCOME EMAIL] Erro ao enviar email:', error)
        emailSentRef.current = false // Permite nova tentativa em caso de erro
      }
    }

    // Aguardar 2 segundos após dados estarem prontos para enviar email
    // Isso garante que a interface carregou completamente
    if (!loading && user && profile) {
      const timeoutId = setTimeout(() => {
        handleWelcomeEmail()
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [user, profile, loading])

  // Reset da flag quando usuário deslogar
  useEffect(() => {
    if (!user) {
      emailSentRef.current = false
    }
  }, [user])
}
