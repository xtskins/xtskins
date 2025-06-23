'use client'

import { Package2, UserLock, Ticket } from 'lucide-react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { userApi } from '@/lib/api/userApi'

export default function AdminArea({
  isSteamIdConfirmed,
}: {
  isSteamIdConfirmed: boolean
}) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [steamId, setSteamId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    if (isSteamIdConfirmed) {
      router.push('/admin')
    } else {
      setIsDialogOpen(true)
    }
  }

  const handleSaveSteamId = async () => {
    if (!steamId.trim()) {
      toast.error('Por favor, digite seu Steam ID')
      return
    }

    setIsLoading(true)
    try {
      const result = await userApi.updateSteamId(steamId.trim())

      if (result.success) {
        toast.success('Steam ID salvo com sucesso!')
        setIsDialogOpen(false)
        router.push('/admin')
      } else {
        toast.error(result.error?.message || 'Erro ao salvar Steam ID')
      }
    } catch {
      toast.error('Erro ao salvar Steam ID')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="w-full p-2">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
          <div className="w-[calc(var(--sidebar-width)-2rem)] md:invisible md:opacity-0 md:group-data-[state=expanded]:visible md:group-data-[state=expanded]:opacity-100">
            <h4 className="text-sm font-medium">Área do Administrador</h4>
            <span className="text-xs">
              A área do administrador é um espaço para você gerenciar o seu
              inventário, editar os valores e a visibilidade das suas skins para
              o público.
            </span>
            <Button
              className="bg-primary mt-2 w-full text-white"
              onClick={handleClick}
            >
              <UserLock className="h-4 w-4 text-white" /> Acessar
            </Button>
            <Button
              className="bg-primary mt-2 w-full text-white"
              onClick={() => router.push('/admin/pedidos')}
            >
              <Package2 className="h-4 w-4 text-white" /> Pedidos
            </Button>
            <Button
              className="bg-primary mt-2 w-full text-white"
              onClick={() => router.push('/admin/cupons')}
            >
              <Ticket className="h-4 w-4 text-white" /> Cupons
            </Button>
          </div>
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleClick}
          >
            <UserLock className="h-4 w-4 text-white" />
          </Button>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push('/admin/pedidos')}
          >
            <Package2 className="h-4 w-4 text-white" />
          </Button>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push('/admin/cupons')}
          >
            <Ticket className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[85%]">
          <DialogHeader>
            <DialogTitle>Steam ID Necessário</DialogTitle>
            <DialogDescription>
              Para acessar a área do administrador, você precisa cadastrar seu
              Steam ID. Isso é necessário para gerenciar seu inventário de
              skins.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-sm">
                Como encontrar seu Steam ID:
              </h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="bg-primary text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shrink-0 font-medium">
                    1
                  </span>
                  <span>
                    Abra a Steam e clique no seu nome Steam no canto superior
                    direito.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-primary text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shrink-0 font-medium">
                    2
                  </span>
                  <span>Selecione &quot;Detalhes da conta&quot;.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-primary text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shrink-0 font-medium">
                    3
                  </span>
                  <span>
                    Seu nome Steam vai estar em letras grandes em cima com a sua
                    ID Steam logo abaixo.
                  </span>
                </li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Você também pode acessar
                  diretamente:{' '}
                  <a
                    href="https://store.steampowered.com/account/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    store.steampowered.com/account/
                  </a>
                </p>
              </div>
            </div>
            <div className="items-center">
              <Input
                id="steamid"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="Ex: 76561198000000000"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveSteamId}
              disabled={isLoading}
              className="text-white"
            >
              {isLoading ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
