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
import { Search, X, Package } from 'lucide-react'

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

// Hook simples para filtros
function useSimpleFilter(skins: SkinData[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedType, setSelectedType] = useState('')

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

    return filtered.slice(0, 100) // Limita a 100 resultados para performance
  }, [skins, searchTerm, selectedGroup, selectedType])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGroup('')
    setSelectedType('')
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
  } = useSimpleFilter(skins)

  const handleSkinSelect = (skin: SkinData) => {
    onSkinSelect(skin)
    setIsOpen(false)
    clearFilters() // Limpa filtros ao fechar
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value)
    setSelectedType('') // Limpa tipo quando muda grupo
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

      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Solicitar Skin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca por nome */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nome da skin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grupo */}
            <Select value={selectedGroup} onValueChange={handleGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {filterOptions.groups.map((group) => (
                  <SelectItem key={group} value={group} className="capitalize">
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {filterOptions.types.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros ativos e estatísticas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredSkins.length} skins encontradas
                {filteredSkins.length === 100 && ' (mostrando primeiras 100)'}
              </span>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Badges dos filtros ativos */}
            <div className="flex gap-1">
              {selectedGroup && selectedGroup !== 'all' && (
                <Badge variant="secondary">{selectedGroup}</Badge>
              )}
              {selectedType && selectedType !== 'all' && (
                <Badge variant="secondary">{selectedType}</Badge>
              )}
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {filteredSkins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma skin encontrada</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredSkins.map((skin, index) => (
                  <button
                    key={`${skin.markethashname}-${index}`}
                    onClick={() => handleSkinSelect(skin)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">
                          {skin.markethashname}
                        </h4>
                        <p className="text-xs text-muted-foreground capitalized">
                          <span className="capitalize">{skin.itemgroup}</span> •{' '}
                          <span className="uppercase">{skin.itemtype}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Selecionar
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dica de uso */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            💡 <strong>Dica:</strong> Use os filtros para encontrar a skin
            desejada mais rapidamente. A busca é feita em tempo real conforme
            você digita.
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
      <Button size="lg" className="w-full">
        <Package className="mr-2 h-5 w-5" />
        Solicitar Skin
      </Button>
    </SkinRequestModal>
  )
}
