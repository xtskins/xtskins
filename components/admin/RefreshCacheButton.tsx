'use client'

import { Button } from '@/components/ui/button'
import { useSkinsCache } from '@/hooks/useSkinsCache'
import { RefreshCw } from 'lucide-react'

interface RefreshCacheButtonProps {
  variant?: 'invalidate' | 'refresh'
  size?: 'sm' | 'default' | 'lg'
  children?: React.ReactNode
}

export function RefreshCacheButton({
  variant = 'refresh',
  size = 'default',
  children,
}: RefreshCacheButtonProps) {
  const { invalidateCache, refreshCache, isInvalidating, isRefreshing } =
    useSkinsCache()

  const handleClick = async () => {
    try {
      if (variant === 'invalidate') {
        await invalidateCache()
      } else {
        await refreshCache()
      }
    } catch (error) {
      console.error('Erro ao atualizar cache:', error)
    }
  }

  const isLoading = variant === 'invalidate' ? isInvalidating : isRefreshing

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {children ||
        (variant === 'invalidate' ? 'Invalidar Cache' : 'Atualizar Skins')}
    </Button>
  )
}

// Exemplo de uso em um componente admin
export function AdminCacheControls() {
  return (
    <div className="flex gap-2">
      <RefreshCacheButton variant="invalidate" size="sm">
        Invalidar Cache
      </RefreshCacheButton>
      <RefreshCacheButton variant="refresh" size="sm">
        Forçar Atualização
      </RefreshCacheButton>
    </div>
  )
}
