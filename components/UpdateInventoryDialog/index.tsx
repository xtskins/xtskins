'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSyncInventory } from '@/hooks/useSyncInventory'
import { useSkinsCache } from '@/hooks/useSkinsCache'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  Package,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Zap,
  Info,
} from 'lucide-react'

function StatusDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          color,
        )}
      />
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', color)}
      />
    </span>
  )
}

function LoadingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          color,
        )}
      />
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', color)}
      />
    </span>
  )
}

export default function UpdateInventoryDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const syncInventoryMutation = useSyncInventory()
  const { refreshCache, isRefreshing } = useSkinsCache()

  const handleUpdateInventory = async () => {
    try {
      console.log('🔄 Iniciando atualização do inventário...')

      // Primeiro atualiza o inventário
      const inventoryResult = await syncInventoryMutation.mutateAsync({
        forceRefresh: true,
      })

      console.log('✅ Inventário atualizado:', inventoryResult)

      // Se deu certo, atualiza o cache das skins também
      console.log('🔄 Iniciando refresh do cache das skins...')
      const cacheResult = await refreshCache()

      console.log('✅ Cache das skins atualizado:', cacheResult)
      console.log('🎉 Processo completo finalizado!')
    } catch (error) {
      console.error('❌ Erro no processo de atualização:', error)
      // O erro já é tratado pelos hooks individuais
    }
  }

  const { data: result, isPending, error } = syncInventoryMutation
  const isUpdating = isPending || isRefreshing

  const getStatusText = () => {
    if (isPending) return 'Sincronizando inventário Steam...'
    if (isRefreshing) return 'Atualizando cache das skins...'
    if (result?.success) return 'Atualização concluída com sucesso!'
    if (error || result?.error) return 'Erro na atualização'
    return 'Pronto para atualizar'
  }

  return (
    <>
      {/* Botão simples */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center space-x-2"
      >
        <Package className="w-4 h-4" />
        <span>Atualizar Inventário</span>
      </Button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[85%] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Atualizar Inventário Steam</span>
            </DialogTitle>
            <DialogDescription>
              Sincronize suas skins do Steam com o banco de dados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status atual */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-[#323232] rounded-lg">
              {isUpdating ? (
                <LoadingDot color="bg-blue-500" />
              ) : result?.success ? (
                <StatusDot color="bg-green-500" />
              ) : error || result?.error ? (
                <StatusDot color="bg-red-500" />
              ) : (
                <StatusDot color="bg-gray-500" />
              )}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>

            {/* Progresso detalhado */}
            {isPending && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Conectando com Steam e buscando skins...
                  </span>
                </div>
              </div>
            )}

            {!isPending && isRefreshing && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Atualizando cache das skins no servidor...
                  </span>
                </div>
              </div>
            )}

            {/* Resultados */}
            {result?.success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    {result.data?.message}
                  </span>
                </div>
                {result.data && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white/50 dark:bg-[#46a7581f] rounded">
                      <Package className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {result.data.totalSkins}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Total
                      </p>
                    </div>
                    <div className="text-center p-2 bg-white/50 dark:bg-[#46a7581f] rounded">
                      <Plus className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {result.data.savedSkins}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Novas
                      </p>
                    </div>
                    <div className="text-center p-2 bg-white/50 dark:bg-[#46a7581f] rounded">
                      <Minus className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {result.data.deletedSkins}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Removidas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(error || result?.error) && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                      {error
                        ? error instanceof Error
                          ? error.message
                          : 'Erro desconhecido'
                        : result?.error?.message}
                    </p>
                    {result?.error?.code && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Código:{' '}
                        <span className="font-mono">{result.error.code}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informações */}
            <div className="bg-gray-50 dark:bg-[#323232] rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                  Como funciona
                </h4>
              </div>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <StatusDot color="bg-blue-500" />
                  <span>Conecta automaticamente com seu Steam ID</span>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusDot color="bg-purple-500" />
                  <span>Sincroniza skins do inventário com o banco</span>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusDot color="bg-green-500" />
                  <span>Atualiza cache automaticamente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusDot color="bg-orange-500" />
                  <span>Remove skins vendidas e adiciona novas</span>
                </div>
              </div>
            </div>

            {/* Botão de ação */}
            <div className="flex space-x-2">
              <Button
                onClick={handleUpdateInventory}
                disabled={isUpdating}
                className="flex-1 text-white"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Atualizar Agora
                  </>
                )}
              </Button>

              {!isUpdating && (
                <Button onClick={() => setIsOpen(false)} variant="outline">
                  Fechar
                </Button>
              )}
            </div>

            {result?.success && (
              <div className="text-xs text-center text-gray-500 dark:text-gray-400 border-t pt-2 flex justify-center items-center gap-2">
                <Info className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span>
                  <strong>Dica:</strong> Abra uma nova guia anônima para testar
                  as mudanças
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
