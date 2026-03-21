import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { steamApi } from '@/lib/api/steamApi'

interface QRAuthState {
  sessionId: string | null
  qrUrl: string | null
  status: 'idle' | 'waiting' | 'success' | 'error'
  message: string | null
}

export function useSteamQRAuth() {
  const [state, setState] = useState<QRAuthState>({
    sessionId: null,
    qrUrl: null,
    status: 'idle',
    message: null,
  })
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  )

  const queryClient = useQueryClient()

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const startQRAuth = useMutation({
    mutationFn: () => steamApi.startQRAuth(),
    onSuccess: (data) => {
      if (data.data) {
        setState({
          sessionId: data.data.sessionId,
          qrUrl: data.data.qrUrl,
          status: 'waiting',
          message: data.data.message,
        })
        startPolling(data.data.sessionId)
      }
    },
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        message: error.message,
      }))
    },
  })

  const startPolling = useCallback(
    (sessionId: string) => {
      console.log('🔄 Iniciando polling duplo para sessionId:', sessionId)

      const interval = setInterval(async () => {
        try {
          // Polling 1: Verificar status da sessão específica
          const sessionResult = await steamApi.checkAuthStatus(sessionId)
          console.log('📊 Status da sessão:', sessionResult)

          if (sessionResult.data?.status === 'completed') {
            console.log('✅ Sessão concluída via polling da sessão')
            setState((prev) => ({
              ...prev,
              status: 'success',
              message: 'Autenticação Steam concluída!',
            }))

            clearInterval(interval)
            setPollingInterval(null)

            // Invalidar cache do steam auth
            queryClient.invalidateQueries({ queryKey: ['steam-auth'] })
            queryClient.invalidateQueries({ queryKey: ['steam-auth-check'] })

            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['steam-auth-check'] })
            }, 1000)
            return
          }

          if (sessionResult.data?.status === 'failed') {
            clearInterval(interval)
            setPollingInterval(null)
            setState((prev) => ({
              ...prev,
              status: 'error',
              message:
                sessionResult.data?.message ||
                'Autenticação Steam não concluída. Tente de novo.',
            }))
            return
          }

          // Polling 2: Verificar se refresh token existe no sistema (backup)
          try {
            const authCheckResult = await steamApi.checkSteamAuth()
            console.log('🔑 Verificação de auth existente:', authCheckResult)

            if (authCheckResult.data?.hasRefreshToken) {
              console.log('✅ Refresh token detectado via verificação de auth')
              setState((prev) => ({
                ...prev,
                status: 'success',
                message: 'Autenticação Steam concluída!',
              }))

              clearInterval(interval)
              setPollingInterval(null)

              // Invalidar cache do steam auth
              queryClient.invalidateQueries({ queryKey: ['steam-auth'] })
              queryClient.invalidateQueries({ queryKey: ['steam-auth-check'] })

              setTimeout(() => {
                queryClient.invalidateQueries({
                  queryKey: ['steam-auth-check'],
                })
              }, 1000)
            }
          } catch (authError) {
            // Falha na verificação de auth não deve interromper o polling principal
            console.log(
              '⚠️ Erro na verificação de auth (não crítico):',
              authError,
            )
          }
        } catch (error) {
          console.error('❌ Erro no polling principal:', error)

          // Se foi erro de sessão não encontrada ou expirada, parar o polling
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          if (
            errorMessage.includes('Sessão não encontrada') ||
            errorMessage.includes('Sessão expirada') ||
            errorMessage.includes('SESSION_NOT_FOUND') ||
            errorMessage.includes('SESSION_EXPIRED')
          ) {
            console.log('❌ Sessão expirada/não encontrada, parando polling')
            clearInterval(interval)
            setPollingInterval(null)
            setState((prev) => ({
              ...prev,
              status: 'error',
              message: errorMessage || 'Sessão expirada',
            }))
          }
        }
      }, 3000) // Aumentei para 3 segundos para dar mais tempo

      setPollingInterval(interval)

      // Auto-timeout após 10 minutos (aumentei o tempo)
      setTimeout(() => {
        console.log('⏰ Timeout do polling após 10 minutos')
        clearInterval(interval)
        setPollingInterval(null)
        setState((prev) => ({
          ...prev,
          status: 'error',
          message: 'Tempo limite para autenticação expirado',
        }))
      }, 600000) // 10 minutos
    },
    [queryClient],
  )

  const resetAuth = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    setState({
      sessionId: null,
      qrUrl: null,
      status: 'idle',
      message: null,
    })
  }, [pollingInterval])

  return {
    state,
    startQRAuth: startQRAuth.mutateAsync,
    isStarting: startQRAuth.isPending,
    resetAuth,
  }
}
