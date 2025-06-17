'use client'

import { Button } from '@/components/ui/button'
import { useSkinsCache } from '@/hooks/useSkinsCache'
import { RefreshCw, Bug, Database } from 'lucide-react'
import { useState } from 'react'

export function CacheDebugger() {
  const { invalidateCache, refreshCache, isInvalidating, isRefreshing } =
    useSkinsCache()
  const [apiTestResult, setApiTestResult] = useState<string | null>(null)

  const testCacheAPI = async () => {
    try {
      setApiTestResult('Testando API...')

      const response = await fetch('/api/cache/skins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      })

      const result = await response.json()
      setApiTestResult(`✅ API: ${result.message} (${result.timestamp})`)

      // Força reload da página após 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setApiTestResult(`❌ Erro: ${error}`)
    }
  }

  const forcePageReload = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Debug do Cache das Skins</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={() => invalidateCache()}
          disabled={isInvalidating}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isInvalidating ? 'animate-spin' : ''}`}
          />
          {isInvalidating
            ? 'Invalidando...'
            : 'Invalidar Cache (Server Action)'}
        </Button>

        <Button
          onClick={() => refreshCache()}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <Database
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Atualizando...' : 'Refresh Cache (Server Action)'}
        </Button>

        <Button onClick={testCacheAPI} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Testar API + Reload
        </Button>

        <Button
          onClick={forcePageReload}
          variant="destructive"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Força Reload da Página
        </Button>
      </div>

      {apiTestResult && (
        <div className="p-3 rounded bg-gray-100 dark:bg-gray-800">
          <p className="text-sm font-mono">{apiTestResult}</p>
        </div>
      )}

      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>
          • <strong>Invalidar Cache:</strong> Limpa cache + revalida páginas
        </p>
        <p>
          • <strong>Refresh Cache:</strong> Força nova busca + revalida páginas
        </p>
        <p>
          • <strong>Testar API:</strong> Usa endpoint HTTP + reload automático
        </p>
        <p>
          • <strong>Força Reload:</strong> Recarrega a página manualmente
        </p>
        <p>• Verifique os logs do console para debug detalhado</p>
      </div>
    </div>
  )
}
