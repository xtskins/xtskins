'use client'

import { useState, useEffect } from 'react'
import { Loader2, Pencil, Plus, Search, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  useCatalogItems,
  useCatalogMutations,
  useImportSteamCatalog,
  useSteamCatalogSearch,
  type CatalogItemRow,
} from '@/hooks/useCatalogAdmin'
import type {
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '@/lib/types/catalog'

function emptyForm(): CreateCatalogItemInput {
  return {
    markethashname: '',
    marketname: '',
    image: '',
    wear: '',
    type: '',
    sub_type: '',
    list_price: 0,
    discount_price: undefined,
    reference_price_steam: undefined,
    is_visible: true,
    sort_order: 0,
    notes: '',
  }
}

function rowToForm(row: CatalogItemRow): CreateCatalogItemInput {
  return {
    markethashname: row.markethashname,
    marketname: row.marketname,
    image: row.image,
    wear: row.wear || '',
    type: row.type || '',
    sub_type: row.sub_type || '',
    list_price: Number(row.list_price),
    discount_price:
      row.discount_price != null && row.discount_price !== ''
        ? Number(row.discount_price)
        : undefined,
    reference_price_steam:
      row.reference_price_steam != null && row.reference_price_steam !== ''
        ? Number(row.reference_price_steam)
        : undefined,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
    notes: row.notes || '',
  }
}

export function CatalogManagement() {
  const { data: items = [], isLoading, error } = useCatalogItems()
  const { createMutation, updateMutation } = useCatalogMutations()
  const importSteamMutation = useImportSteamCatalog()

  const [steamQuery, setSteamQuery] = useState('')
  const [debouncedSteamQuery, setDebouncedSteamQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSteamQuery(steamQuery.trim()), 450)
    return () => clearTimeout(t)
  }, [steamQuery])

  const steamSearch = useSteamCatalogSearch(debouncedSteamQuery)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateCatalogItemInput>(emptyForm)

  useEffect(() => {
    if (!dialogOpen) {
      setEditingId(null)
      setForm(emptyForm())
    }
  }, [dialogOpen])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (row: CatalogItemRow) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (!form.markethashname.trim() || !form.marketname.trim()) {
        toast.error('Preencha markethashname e marketname')
        return
      }
      if (!form.image.trim()) {
        toast.error('Informe a URL da imagem')
        return
      }

      const payload: CreateCatalogItemInput = {
        ...form,
        type: form.type || undefined,
        sub_type: form.sub_type || undefined,
        notes: form.notes || undefined,
        discount_price: form.discount_price,
        reference_price_steam: form.reference_price_steam,
      }

      if (editingId) {
        const patch: UpdateCatalogItemInput = { ...payload }
        await updateMutation.mutateAsync({ id: editingId, body: patch })
        toast.success('Item atualizado')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Item criado')
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  const handleImportSteam = async (markethashname: string) => {
    const r = await importSteamMutation.mutateAsync(markethashname)
    if (r.ok) {
      toast.success('Item importado — ajuste o preço na lista se quiser.')
      return
    }
    if (r.status === 409 && r.existingId) {
      toast.message('Já está no catálogo.')
      const row = items.find((i) => i.id === r.existingId)
      if (row) openEdit(row)
      return
    }
    toast.error(r.message)
  }

  const openEditByHash = (markethashname: string) => {
    const row = items.find((i) => i.markethashname === markethashname)
    if (row) openEdit(row)
    else toast.message('Atualize a lista ou busque de novo.')
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        {error instanceof Error ? error.message : 'Erro ao carregar catálogo'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Store className="h-6 w-6" />
            Catálogo da vitrine
          </h1>
          <p className="text-muted-foreground text-sm">
            Busque itens na Steam Web API (CS2), importe com um clique e só
            ajuste preço e visibilidade. Mesma <code className="text-xs">STEAM_API_KEY</code>{' '}
            do inventário.
          </p>
        </div>
        <Button variant="outline" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Cadastro manual
        </Button>
      </div>

      <Card className="dark:border-[#343434] dark:bg-[#232323]">
        <CardHeader>
          <CardTitle className="text-base">Buscar itens (Steam)</CardTitle>
          <p className="text-muted-foreground text-sm font-normal">
            Mínimo 3 caracteres. Preços em dólar vêm da API; na importação
            convertemos para R$ (cotação atual ou fallback).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Ex.: AK-47 Redline, AWP Asiimov..."
              value={steamQuery}
              onChange={(e) => setSteamQuery(e.target.value)}
            />
          </div>
          {debouncedSteamQuery.length > 0 && debouncedSteamQuery.length < 3 && (
            <p className="text-muted-foreground text-sm">
              Digite mais caracteres para buscar.
            </p>
          )}
          {steamSearch.isFetching && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </div>
          )}
          {steamSearch.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {steamSearch.error instanceof Error
                ? steamSearch.error.message
                : 'Erro na busca'}
            </p>
          )}
          {steamSearch.data && steamSearch.data.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum resultado.</p>
          )}
          {steamSearch.data && steamSearch.data.length > 0 && (
            <ul className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
              {steamSearch.data
                .filter((h) => h.markethashname)
                .map((hit) => (
                  <li
                    key={hit.markethashname}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-2 dark:border-[#343434]"
                  >
                    {hit.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hit.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded border bg-muted object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded border bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {hit.marketname}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        Steam ~$
                        {hit.pricelatestUsd != null
                          ? hit.pricelatestUsd.toFixed(2)
                          : '—'}
                        {hit.pricerealUsd != null
                          ? ` · mercados ~$${hit.pricerealUsd.toFixed(2)}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {hit.inCatalog ? (
                        <>
                          <Badge variant="secondary">No catálogo</Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditByHash(hit.markethashname)}
                          >
                            Editar preço
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="text-white"
                          disabled={importSteamMutation.isPending}
                          onClick={() =>
                            void handleImportSteam(hit.markethashname)
                          }
                        >
                          {importSteamMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Importar'
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="dark:border-[#343434] dark:bg-[#232323]">
        <CardHeader>
          <CardTitle className="text-base">
            {items.length} item(ns) cadastrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum item. Clique em &quot;Novo item&quot; para adicionar à
              vitrine.
            </p>
          ) : (
            items.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3 dark:border-[#343434]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded border bg-muted object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.marketname}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {row.markethashname}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    R${' '}
                    {Number(row.discount_price ?? row.list_price).toFixed(2)}
                  </div>
                  {row.discount_price != null &&
                    Number(row.discount_price) !== Number(row.list_price) && (
                      <div className="text-muted-foreground text-xs line-through">
                        R$ {Number(row.list_price).toFixed(2)}
                      </div>
                    )}
                  <div className="text-muted-foreground text-xs">
                    {row.is_visible ? 'Visível' : 'Oculto'}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar item' : 'Novo item do catálogo'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="mh">markethashname *</Label>
              <Input
                id="mh"
                value={form.markethashname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, markethashname: e.target.value }))
                }
                placeholder="AK-47 | Redline (Field-Tested)"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mn">marketname *</Label>
              <Input
                id="mn"
                value={form.marketname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marketname: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="img">URL da imagem *</Label>
              <Input
                id="img"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="wear">Wear</Label>
                <Input
                  id="wear"
                  value={form.wear}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, wear: e.target.value }))
                  }
                  placeholder="FN, MW, FT..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sort">Ordem</Label>
                <Input
                  id="sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  value={form.type || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  placeholder="Rifle"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="st">Subtipo</Label>
                <Input
                  id="st"
                  value={form.sub_type || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sub_type: e.target.value }))
                  }
                  placeholder="AK-47"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="list">Preço lista (R$)</Label>
                <Input
                  id="list"
                  type="number"
                  step="0.01"
                  value={form.list_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      list_price: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="disc">Preço venda (R$)</Label>
                <Input
                  id="disc"
                  type="number"
                  step="0.01"
                  value={form.discount_price ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_price:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ref">Preço referência Steam (R$)</Label>
              <Input
                id="ref"
                type="number"
                step="0.01"
                value={form.reference_price_steam ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    reference_price_steam:
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
                placeholder="Opcional"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_visible ?? true}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, is_visible: v }))
                }
              />
              <span className="text-sm font-medium">Visível na loja</span>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas internas</Label>
              <Input
                id="notes"
                value={form.notes || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white"
              onClick={() => void handleSubmit()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
