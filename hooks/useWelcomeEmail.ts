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

      try {
        emailSentRef.current = true

        await sendWelcomeEmail({
          firstName: profile.name.split(' ')[0],
          email: user.email || '',
          isNewUser: !profile.welcome_email_sent,
        })
      } catch (error) {
        console.error(error)
        emailSentRef.current = false
      }
    }

    if (!loading && user && profile) {
      const timeoutId = setTimeout(() => {
        handleWelcomeEmail()
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [user, profile, loading])

  useEffect(() => {
    if (!user) {
      emailSentRef.current = false
    }
  }, [user])
}
