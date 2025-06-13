import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient(jwt?: string) {
  const options = jwt
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
    : undefined

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usar service role key para operações do servidor
    options,
  )
}
