import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useCallback } from 'react'

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha()

  const executeRecaptchaAction = useCallback(
    async (action: string): Promise<string> => {
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA não está carregado')
      }

      try {
        const token = await executeRecaptcha(action)
        return token
      } catch (error) {
        console.error('Erro ao executar reCAPTCHA:', error)
        throw new Error('Falha na verificação de segurança')
      }
    },
    [executeRecaptcha],
  )

  return {
    executeRecaptchaAction,
    isRecaptchaLoaded: !!executeRecaptcha,
  }
}
