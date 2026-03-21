/**
 * Integração Vercel ↔ Supabase injeta variáveis com prefixo STORAGE_.
 * Fallbacks mantêm compatibilidade com .env local (docs/NGROK_SETUP.md).
 */
function firstDefined(
  ...values: (string | undefined | null)[]
): string | undefined {
  for (const v of values) {
    const t = typeof v === 'string' ? v.trim() : ''
    if (t) return t
  }
  return undefined
}

export function getSupabaseUrl(): string | undefined {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL,
    process.env.STORAGE_SUPABASE_URL,
  )
}

export function getSupabaseAnonKey(): string | undefined {
  return firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_PUBLISHABLE_KEY,
    process.env.STORAGE_SUPABASE_ANON_KEY,
    process.env.STORAGE_SUPABASE_PUBLISHABLE_KEY,
  )
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
  )
}
