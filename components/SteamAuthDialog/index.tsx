'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSteamQRAuth } from '@/hooks/useSteamQRAuth'
import {
  Loader2,
  Smartphone,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface SteamAuthDialogProps {
  open: boolean
  onClose: () => void
  required?: boolean
}

export default function SteamAuthDialog({
  open,
  onClose,
  required = false,
}: SteamAuthDialogProps) {
  const { state, startQRAuth, isStarting, resetAuth } = useSteamQRAuth()

  const handleStartAuth = async () => {
    try {
      await startQRAuth()
    } catch (error) {
      console.error('Erro ao iniciar autenticação Steam:', error)
    }
  }

  const handleClose = () => {
    if (required && state.status !== 'success') {
      return
    }
    resetAuth()
    onClose()
  }

  const handleCancelRequired = () => {
    resetAuth()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={required ? undefined : handleClose}>
      <DialogContent className="sm:max-w-md max-w-[85%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {required ? 'Configuração Obrigatória Steam' : 'Configuração Steam'}
          </DialogTitle>
          <DialogDescription>
            {required
              ? 'Para acessar o painel admin, você precisa configurar a autenticação Steam uma única vez.'
              : 'Para buscar automaticamente seu inventário Steam, você precisa configurar a autenticação uma única vez.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso se é obrigatório */}
          {required && state.status === 'idle' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Configuração Obrigatória
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300">
                    Esta configuração é necessária para acessar o painel de
                    administração.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Idle - Explicação inicial */}
          {state.status === 'idle' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Como funciona?
                    </p>
                    <p className="mt-1 text-blue-700 dark:text-blue-300">
                      Você irá escanear um QR Code com o aplicativo Steam Mobile
                      para autorizar o acesso ao seu inventário.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Processo seguro e oficial da Steam</p>
                <p>• Configuração única - não precisa repetir</p>
                <p>• Seus dados ficam protegidos</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartAuth}
                  disabled={isStarting}
                  className="flex-1 text-white"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    'Iniciar Configuração'
                  )}
                </Button>

                {required && (
                  <Button
                    variant="outline"
                    onClick={handleCancelRequired}
                    className="flex-1"
                  >
                    Sair
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Status Waiting - Mostrar QR Code */}
          {state.status === 'waiting' && state.qrUrl && (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="font-medium">Escaneie o QR Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Abra o aplicativo Steam Mobile e escaneie o código abaixo
                </p>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(state.qrUrl)}`}
                  alt="QR Code para autenticação Steam"
                  className="max-w-[200px] max-h-[200px]"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando confirmação...
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetAuth}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>

                {required && (
                  <Button
                    variant="outline"
                    onClick={handleCancelRequired}
                    className="flex-1"
                  >
                    Sair
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Status Success */}
          {state.status === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-green-700 dark:text-green-300">
                  Configuração Concluída!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sua autenticação Steam foi configurada com sucesso. Agora você
                  pode
                  {required
                    ? ' acessar o painel de administração.'
                    : ' buscar seu inventário automaticamente.'}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                {required ? 'Acessar Painel Admin' : 'Continuar'}
              </Button>
            </div>
          )}

          {/* Status Error */}
          {state.status === 'error' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-red-700 dark:text-red-300">
                  Erro na Configuração
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {state.message || 'Ocorreu um erro durante a configuração.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetAuth}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>

                {required ? (
                  <Button
                    variant="outline"
                    onClick={handleCancelRequired}
                    className="flex-1"
                  >
                    Sair
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
