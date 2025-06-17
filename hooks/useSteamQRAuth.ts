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
      const interval = setInterval(async () => {
        try {
          const result = await steamApi.checkAuthStatus(sessionId)

          if (result.data?.status === 'completed') {
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

            // Aguardar um pouco antes de fechar automaticamente para dar tempo do usuário ver a mensagem
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['steam-auth-check'] })
            }, 3000)
          }
        } catch (error) {
          console.error('Erro no polling:', error)
        }
      }, 2000)

      setPollingInterval(interval)

      // Auto-timeout após 5 minutos
      setTimeout(() => {
        clearInterval(interval)
        setPollingInterval(null)
        setState((prev) => ({
          ...prev,
          status: 'error',
          message: 'Tempo limite para autenticação expirado',
        }))
      }, 120000) // 2 minutos
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
