import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

const ADMIN_ROUTES = ['/admin']
const PUBLIC_ROUTES = ['/']

function nextWithRequestHeaders(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] Supabase: defina URL + chave anon (NEXT_PUBLIC_SUPABASE_* ou NEXT_PUBLIC_STORAGE_SUPABASE_* da integração Vercel) e faça redeploy.',
    )
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return nextWithRequestHeaders(request)
  }

  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAdminRoute = ADMIN_ROUTES.some((route) =>
      pathname.startsWith(route),
    )

    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route),
    )

    if (isAdminRoute) {
      if (!user) {
        console.log(
          `Tentativa de acesso não autenticado à rota de admin: ${pathname}`,
        )
        return NextResponse.redirect(new URL('/', request.url))
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(
          `Erro ao buscar perfil do usuário ${user.id}:`,
          profileError,
        )
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (profile?.role !== 'admin') {
        console.log(
          `Usuário ${user.id} (role: ${profile?.role}) tentou acessar rota de admin: ${pathname}`,
        )
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log(`Admin ${user.id} acessou rota: ${pathname}`)
    }

    if (!isPublicRoute && !user) {
      console.log(`Acesso não autenticado à rota protegida: ${pathname}`)
    }

    return response
  } catch (err) {
    console.error('[middleware] falha ao executar Supabase/auth:', err)
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return nextWithRequestHeaders(request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/v1/skins (public API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/v1/skins).*)',
  ],
}
