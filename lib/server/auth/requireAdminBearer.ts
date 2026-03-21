import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AdminBearerResult =
  | { ok: true }
  | { ok: false; response: Response }

export async function requireAdminBearer(
  req: Request,
): Promise<AdminBearerResult> {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Token obrigatório', code: 'VALIDATION_ERROR' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  const supabase = createServerSupabaseClient(accessToken)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Não autenticado', code: 'UNAUTHORIZED' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Acesso negado', code: 'FORBIDDEN' },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    }
  }

  return { ok: true }
}
