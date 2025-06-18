import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface SteamAuthResult {
  success: boolean
  steamLoginSecure?: string
  refreshToken?: string
  error?: string
}

export class SteamAuthService {
  private static instance: SteamAuthService
  private loginSession: LoginSession | null = null
  // Cache de steam_login_secure com timestamp
  private cachedSteamLoginSecure: {
    token: string
    timestamp: number
    refreshToken: string
  } | null = null

  // Controle de concorrência
  private isGeneratingToken = false
  private pendingPromises: Promise<SteamAuthResult>[] = []

  private constructor() {}

  static getInstance(): SteamAuthService {
    if (!SteamAuthService.instance) {
      SteamAuthService.instance = new SteamAuthService()
      console.log('🆕 [STEAM_AUTH_SERVICE] New instance created')
    } else {
      console.log('♻️ [STEAM_AUTH_SERVICE] Using existing instance')
    }
    return SteamAuthService.instance
  }

  /**
   * Salva o refresh token Steam do admin no banco de dados
   */
  async saveRefreshToken(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createServerSupabaseClient(accessToken)

      // Verificar se o usuário é admin
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Verificar se é admin (você pode ajustar esta verificação conforme sua lógica)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar user profile:', profileError)
        return {
          success: false,
          error: `Erro ao verificar permissões: ${profileError.message}`,
        }
      }

      if (!userProfile) {
        return {
          success: false,
          error: 'Usuário não encontrado na tabela users.',
        }
      }

      if (userProfile.role !== 'admin') {
        return {
          success: false,
          error: `Acesso negado: role atual é '${userProfile.role}', precisa ser 'admin'`,
        }
      }

      // Salvar/atualizar refresh token
      const { error } = await supabase.from('steam_admin_credentials').upsert({
        user_id: userData.user.id,
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Erro ao salvar refresh token Steam:', error)
        return { success: false, error: 'Erro ao salvar refresh token' }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro no saveRefreshToken:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Obtém o refresh token Steam do admin do banco de dados
   */
  async getRefreshToken(accessToken: string): Promise<string | null> {
    try {
      const supabase = createServerSupabaseClient(accessToken)

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        return null
      }

      const { data, error } = await supabase
        .from('steam_admin_credentials')
        .select('refresh_token')
        .eq('user_id', userData.user.id)
        .single()

      if (error || !data) {
        return null
      }

      return data.refresh_token
    } catch (error) {
      console.error('Erro ao obter refresh token Steam:', error)
      return null
    }
  }

  /**
   * Obtém um steam_login_secure válido usando refresh token
   * Implementa cache e controle de concorrência para evitar múltiplas sessões
   */
  async getSteamLoginSecure(accessToken: string): Promise<SteamAuthResult> {
    console.log('🔑 [STEAM_AUTH_SERVICE] getSteamLoginSecure started')

    try {
      const refreshToken = await this.getRefreshToken(accessToken)
      if (!refreshToken) {
        console.log('❌ [STEAM_AUTH_SERVICE] Refresh token not found')
        return {
          success: false,
          error:
            'Refresh token não configurado. Configure primeiro via interface admin.',
        }
      }

      console.log(
        '🔑 [STEAM_AUTH_SERVICE] Refresh token obtained:',
        refreshToken,
      )

      // CACHE DESABILITADO - sempre gerar novo token
      console.log(
        '🔄 [STEAM_AUTH_SERVICE] Cache disabled, always generating new token',
      )

      // Se já está gerando um token, aguardar a promessa existente
      if (this.isGeneratingToken) {
        console.log(
          '⏳ [STEAM_AUTH_SERVICE] Waiting for token generation in progress...',
        )
        // Aguardar um pouco e tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 100))
        return this.getSteamLoginSecure(accessToken)
      }

      this.isGeneratingToken = true
      console.log('🏗️ [STEAM_AUTH_SERVICE] Starting new token generation')

      try {
        const result = await this.renewCookiesWithRefreshToken(refreshToken)

        if (result.success && result.steamLoginSecure) {
          // Armazenar no cache
          this.cachedSteamLoginSecure = {
            token: result.steamLoginSecure,
            timestamp: Date.now(),
            refreshToken,
          }
          console.log(
            '✅ [STEAM_AUTH_SERVICE] New steam_login_secure generated and cached - Token:',
            result.steamLoginSecure,
          )
        } else {
          console.log(
            '❌ [STEAM_AUTH_SERVICE] Failed to generate new token:',
            result.error,
          )
        }

        return result
      } finally {
        this.isGeneratingToken = false
        console.log('🔓 [STEAM_AUTH_SERVICE] Releasing token generation lock')
      }
    } catch (error) {
      console.error(
        '❌ [STEAM_AUTH_SERVICE] Error in getSteamLoginSecure:',
        error,
      )
      this.isGeneratingToken = false
      return {
        success: false,
        error: 'Erro interno ao obter steam_login_secure',
      }
    }
  }

  /**
   * Renova cookies usando refresh token existente
   */
  private async renewCookiesWithRefreshToken(
    refreshToken: string,
  ): Promise<SteamAuthResult> {
    console.log('🔄 [RENEWAL] Starting cookie renewal with refresh token')

    try {
      this.loginSession = new LoginSession(EAuthTokenPlatformType.WebBrowser)
      this.loginSession.refreshToken = refreshToken
      console.log('🔄 [RENEWAL] LoginSession created, obtaining cookies...')

      const cookies = await this.loginSession.getWebCookies()
      console.log(
        '🍪 [RENEWAL] Cookies obtained from Steam:',
        cookies.length,
        'cookies received',
      )

      const steamLoginSecure = this.extractSteamLoginSecure(cookies)
      console.log('🔍 [RENEWAL] steamLoginSecure extraction:', {
        found: !!steamLoginSecure,
        token: steamLoginSecure || 'not found',
      })

      if (steamLoginSecure) {
        console.log('✅ [RENEWAL] steamLoginSecure extracted successfully')
        return {
          success: true,
          steamLoginSecure,
          refreshToken, // Retorna o mesmo refresh token
        }
      }

      console.log('❌ [RENEWAL] steamLoginSecure not found in cookies')
      return {
        success: false,
        error: 'steam_login_secure não encontrado nos cookies',
      }
    } catch (error) {
      console.error('❌ [RENEWAL] Error renewing cookies:', error)
      return {
        success: false,
        error: `Falha ao renovar cookies com refresh token: ${error}`,
      }
    }
  }

  /**
   * Extrai o valor steam_login_secure dos cookies
   */
  private extractSteamLoginSecure(cookies: string[]): string | null {
    for (const cookie of cookies) {
      if (cookie.startsWith('steamLoginSecure=')) {
        const value = cookie.split('=')[1].split(';')[0]
        return value
      }
    }
    return null
  }

  /**
   * Atualiza o refresh token no banco de dados
   */
  async updateRefreshToken(
    accessToken: string,
    newRefreshToken: string,
  ): Promise<void> {
    try {
      const supabase = createServerSupabaseClient(accessToken)
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        await supabase
          .from('steam_admin_credentials')
          .update({
            refresh_token: newRefreshToken,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userData.user.id)
      }
    } catch (error) {
      console.error('Erro ao atualizar refresh token:', error)
    }
  }

  /**
   * Verifica se o refresh token está próximo do vencimento (30 dias antes)
   */
  isRefreshTokenExpiringSoon(refreshToken: string): boolean {
    try {
      // Decodificar JWT sem verificar assinatura (apenas para ler exp)
      const payload = JSON.parse(
        Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
      )

      const expirationTime = payload.exp * 1000 // Converter para milliseconds
      const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000

      return expirationTime < thirtyDaysFromNow
    } catch (error) {
      console.error('Erro ao verificar expiração do refresh token:', error)
      return true // Se não conseguir verificar, assume que está expirando
    }
  }

  /**
   * Remove o refresh token do banco (logout)
   */
  async removeRefreshToken(
    accessToken: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createServerSupabaseClient(accessToken)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { error } = await supabase
        .from('steam_admin_credentials')
        .delete()
        .eq('user_id', userData.user.id)

      if (error) {
        return { success: false, error: 'Erro ao remover refresh token' }
      }

      // Limpar cache ao remover refresh token
      this.clearCache()

      return { success: true }
    } catch (error) {
      console.error('Erro ao remover refresh token:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Limpa o cache de steam_login_secure
   */
  clearCache(): void {
    this.cachedSteamLoginSecure = null
    this.isGeneratingToken = false
    console.log('🧹 [STEAM_AUTH_SERVICE] steam_login_secure cache cleared')
  }

  /**
   * Força renovação do steam_login_secure ignorando cache
   */
  async forceSteamLoginSecureRenewal(
    accessToken: string,
  ): Promise<SteamAuthResult> {
    console.log('🔄 Forçando renovação do steam_login_secure...')
    this.clearCache()
    return this.getSteamLoginSecure(accessToken)
  }
}
