import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()

    // Criar cliente Supabase para SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch (error) {
              // SSR-friendly: não fazer nada se falhar durante build/static generation
              console.warn(
                'Falha ao definir cookies durante renderização estática:',
                error,
              )
            }
          },
        },
      },
    )

    // Verificar usuário autenticado de forma segura
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Buscar access token da sessão para usar no server client
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return null
    }

    return {
      user,
      accessToken: session.access_token,
      serverSupabase: createServerSupabaseClient(session.access_token),
    }
  } catch (error) {
    console.error('Erro na autenticação do servidor:', error)
    return null
  }
}
