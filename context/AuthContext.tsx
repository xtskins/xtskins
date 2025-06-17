'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types/user'
import { useUser } from '@/hooks/useUser'
import { Skin, SkinType } from '@/lib/types/skin'

interface ServerUserData {
  user: SupabaseUser | null
  profile: User | null
  skinTypes: SkinType[]
  skins: Skin[]
}

type AuthContextType = {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  serverData: ServerUserData
}

export function AuthProvider({ children, serverData }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const currentUser = serverData?.user || user

  const initialProfile = useMemo(() => {
    return serverData?.profile || undefined
  }, [serverData?.profile])

  const { data: profile } = useUser(currentUser?.id, initialProfile)

  useEffect(() => {
    if (serverData?.user) {
      setUser(serverData.user)
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, serverData])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const value = {
    user: currentUser,
    profile: profile ?? null,
    loading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
