import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

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

  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceRoleKey()

  return createClient(
    url!,
    serviceKey!, // service role para operações do servidor
    options,
  )
}
