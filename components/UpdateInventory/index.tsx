'use client'

import { Button } from '@/components/ui/button'
import { useSyncInventory } from '@/hooks/useSyncInventory'
import { useSkinsCache } from '@/hooks/useSkinsCache'

export default function UpdateInventoryButton() {
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

  // Determina o texto do botão baseado no estado atual
  const getButtonText = () => {
    if (isPending) return 'Atualizando inventário...'
    if (isRefreshing) return 'Atualizando cache das skins...'
    return 'Atualizar Inventário'
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Atualizar Inventário Steam</h3>

        <Button
          onClick={handleUpdateInventory}
          disabled={isUpdating}
          className="w-full text-white"
        >
          {getButtonText()}
        </Button>

        {/* Status visual melhorado */}
        {isPending && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            🔄 Sincronizando inventário Steam...
          </div>
        )}

        {!isPending && isRefreshing && (
          <div className="text-sm text-orange-600 dark:text-orange-400">
            🔄 Atualizando cache das skins no servidor...
          </div>
        )}
      </div>

      {result && (
        <div
          className={`p-3 rounded-lg ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {result.success ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ {result.data?.message}
              </p>
              {result.data && (
                <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  <p>📦 Total de skins: {result.data.totalSkins}</p>
                  <p>➕ Skins adicionadas: {result.data.savedSkins}</p>
                  <p>➖ Skins removidas: {result.data.deletedSkins}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ❌ {result.error?.message}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Código: {result.error?.code}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            ❌ {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Usa automaticamente o Steam ID do seu perfil</p>
        <p>• Usa automaticamente o refresh token Steam configurado</p>
        <p>• Sincroniza skins do inventário com o banco de dados</p>
        <p>• Remove skins vendidas e adiciona novas skins</p>
        <p>• Atualiza automaticamente o cache das skins após sincronização</p>
        <p>
          • <strong>Importante:</strong> Após a atualização, abra uma nova guia
          anônima para testar
        </p>
      </div>
    </div>
  )
}
