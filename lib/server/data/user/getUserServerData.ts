import { getAuthenticatedUser } from '@/lib/utils/auth'
import { userSchema } from '@/lib/types/user'

export async function getUserServerData() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth) {
      return { user: null, profile: null }
    }

    const { user, serverSupabase } = auth

    const { data: profile } = await serverSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const validatedProfile = profile ? userSchema.parse(profile) : null

    return {
      user,
      profile: validatedProfile,
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário no servidor:', error)
    return { user: null, profile: null }
  }
}
