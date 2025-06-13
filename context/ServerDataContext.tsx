'use client'

import { createContext, useContext } from 'react'
import { User } from '@/lib/types/user'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface ServerUserData {
  user: SupabaseUser | null
  profile: User | null
}

const ServerDataContext = createContext<ServerUserData | null>(null)

export function ServerDataProvider({
  children,
  data,
}: {
  children: React.ReactNode
  data: ServerUserData
}) {
  return (
    <ServerDataContext.Provider value={data}>
      {children}
    </ServerDataContext.Provider>
  )
}

export function useServerData() {
  const context = useContext(ServerDataContext)
  return context
}
