'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, X, Package, Filter, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkinData {
  markethashname: string
  itemgroup: string
  itemtype: string
}

interface SkinRequestModalProps {
  skins: SkinData[]
  onSkinSelect: (skin: SkinData) => void
  children?: React.ReactNode
}

// Hook para filtros melhorado
function useEnhancedFilter(skins: SkinData[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Opções únicas para os selects
  const filterOptions = useMemo(() => {
    const groups = [
      ...new Set(skins.map((skin) => skin.itemgroup).filter(Boolean)),
    ].sort()
    const types = [
      ...new Set(skins.map((skin) => skin.itemtype).filter(Boolean)),
    ].sort()

    // Tipos filtrados por grupo selecionado
    const typesForGroup =
      selectedGroup && selectedGroup !== 'all'
        ? [
            ...new Set(
              skins
                .filter((skin) => skin.itemgroup === selectedGroup)
                .map((skin) => skin.itemtype)
                .filter(Boolean),
            ),
          ].sort()
        : types

    return { groups, types: typesForGroup }
  }, [skins, selectedGroup])

  // Filtros aplicados
  const filteredSkins = useMemo(() => {
    let filtered = skins

    // Filtro por grupo
    if (selectedGroup && selectedGroup !== 'all') {
      filtered = filtered.filter((skin) => skin.itemgroup === selectedGroup)
    }

    // Filtro por tipo
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter((skin) => skin.itemtype === selectedType)
    }

    // Busca textual inteligente
    if (searchTerm) {
      const searchWords = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais como |, -, ™
        .split(/\s+/)
        .filter((word) => word.length > 1) // Ignora palavras muito curtas

      filtered = filtered.filter((skin) => {
        // Normaliza o nome da skin para busca
        const normalizedSkinName = skin.markethashname
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')

        // Normaliza o tipo da arma
        const normalizedType = skin.itemtype
          ? skin.itemtype.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
          : ''

        // Verifica se todas as palavras da busca estão presentes
        return searchWords.every(
          (word) =>
            normalizedSkinName.includes(word) || normalizedType.includes(word),
        )
      })
    }

    return filtered.slice(0, 150) // Aumentei o limite para 150
  }, [skins, searchTerm, selectedGroup, selectedType])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGroup('')
    setSelectedType('')
    setShowFilters(false)
  }

  const hasFilters =
    searchTerm ||
    (selectedGroup && selectedGroup !== 'all') ||
    (selectedType && selectedType !== 'all')

  return {
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    selectedType,
    setSelectedType,
    filteredSkins,
    filterOptions,
    clearFilters,
    hasFilters,
    showFilters,
    setShowFilters,
  }
}

export function SkinRequestModal({
  skins,
  onSkinSelect,
  children,
}: SkinRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    searchTerm,
    setSearchTerm,
    selectedGroup,
    setSelectedGroup,
    selectedType,
    setSelectedType,
    filteredSkins,
    filterOptions,
    clearFilters,
    hasFilters,
    showFilters,
    setShowFilters,
  } = useEnhancedFilter(skins)

  const handleSkinSelect = (skin: SkinData) => {
    onSkinSelect(skin)
    setIsOpen(false)
    clearFilters() // Limpa filtros ao fechar
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value)
    setSelectedType('') // Limpa tipo quando muda grupo
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Solicitar Skin
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[85%] max-w-4xl h-[90vh] max-h-[600px] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Solicitar Skin
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Área de Busca e Filtros */}
          <div className="px-4 py-3 border-b bg-muted/20 shrink-0">
            {/* Busca Principal */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                placeholder="Busque por nome da skin ou tipo de arma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-12 h-11 text-base"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFilters}
                className={cn(
                  'absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 transition-colors',
                  showFilters || hasFilters
                    ? 'bg-primary text-primary-foreground'
                    : '',
                )}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Filtros Avançados */}
            {showFilters && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grupo */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Categoria
                    </label>
                    <Select
                      value={selectedGroup}
                      onValueChange={handleGroupChange}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {filterOptions.groups.map((group) => (
                          <SelectItem
                            key={group}
                            value={group}
                            className="capitalize"
                          >
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Tipo de Arma
                    </label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {filterOptions.types.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Status e Ações */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {filteredSkins.length} skins
                  {filteredSkins.length === 150 && ' (mostrando primeiras 150)'}
                </span>

                {/* Badges dos filtros ativos */}
                <div className="flex gap-1">
                  {selectedGroup && selectedGroup !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedGroup}
                    </Badge>
                  )}
                  {selectedType && selectedType !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedType}
                    </Badge>
                  )}
                </div>
              </div>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de Resultados */}
          <div className="flex-1 overflow-hidden">
            {filteredSkins.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <Package className="mx-auto h-16 w-16 mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhuma skin encontrada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tente ajustar os filtros ou alterar os termos da busca
                  </p>
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 divide-y">
                  {filteredSkins.map((skin, index) => (
                    <button
                      key={`${skin.markethashname}-${index}`}
                      onClick={() => handleSkinSelect(skin)}
                      className="group w-full p-4 text-left hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {skin.markethashname}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {skin.itemgroup}
                            </Badge>
                            <span className="text-xs text-muted-foreground uppercase font-mono">
                              {skin.itemtype}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer com Dica */}
          <div className="px-4 py-3 border-t bg-muted/20 shrink-0">
            <div className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary">💡</span>
              <div>
                <span className="font-medium">Dica:</span> Use os filtros para
                encontrar a skin desejada mais rapidamente. A busca funciona em
                tempo real conforme você digita.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Versão simplificada do botão
export function SkinRequestButton({
  skins,
  onSkinSelect,
}: Omit<SkinRequestModalProps, 'children'>) {
  return (
    <SkinRequestModal skins={skins} onSkinSelect={onSkinSelect}>
      <Button size="lg" className="w-full text-white">
        <Package className="mr-2 h-5 w-5" />
        Solicitar Skin
      </Button>
    </SkinRequestModal>
  )
}
