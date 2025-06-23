'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Users, Package, Activity } from 'lucide-react'
import { useCoupons } from '@/hooks/useCoupons'
import { CouponCard } from '@/components/admin/CouponCard'
import { CouponForm } from '@/components/admin/CouponForm'
import { Coupon } from '@/lib/types/coupon'

export function CouponManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: coupons = [], isLoading, error } = useCoupons()

  // Filtrar cupons baseado nos filtros
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || coupon.status === statusFilter
    const matchesType = typeFilter === 'all' || coupon.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Estatísticas
  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.status === 'active').length,
    inactive: coupons.filter((c) => c.status === 'inactive').length,
    expired: coupons.filter(
      (c) => c.end_date && new Date(c.end_date) < new Date(),
    ).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.used_count, 0),
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    setEditingCoupon(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-full overflow-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-6 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 flex-shrink-0"></div>
        </div>

        {/* Estatísticas Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Card
              key={i}
              className="min-w-0 dark:border-[#343434] dark:bg-[#232323]"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                <div className="h-3 bg-muted rounded w-12"></div>
                <div className="h-4 w-4 bg-muted rounded flex-shrink-0"></div>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <div className="h-5 bg-muted rounded w-8 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros Skeleton */}
        <Card className="overflow-hidden dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded w-full"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-10 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de cupons Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 bg-muted rounded w-32"></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="flex flex-col h-full dark:border-[#343434] dark:bg-[#232323]"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 px-4 pt-4">
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-muted rounded w-20 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0 ml-2">
                    <div className="h-6 bg-muted rounded w-12"></div>
                    <div className="h-8 w-8 bg-muted rounded"></div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full px-4 pb-4 pt-0">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-8 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-12 bg-muted rounded w-full"></div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="h-8 bg-muted rounded w-full"></div>
                      <div className="h-8 bg-muted rounded w-full"></div>
                    </div>
                    <div className="h-12 bg-muted rounded w-full"></div>
                  </div>
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <div className="h-8 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Erro ao carregar cupons</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold truncate">Gerenciar Cupons</h1>
          <p className="text-muted-foreground text-sm">
            Crie e gerencie cupons de desconto para seus clientes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex-shrink-0 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Cupom
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <Card className="min-w-0 dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              Total
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-lg font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">cupons</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              Ativos
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-lg font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">disponíveis</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              Inativos
            </CardTitle>
            <Activity className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-lg font-bold text-yellow-600">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">pausados</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              Expirados
            </CardTitle>
            <Activity className="h-4 w-4 text-red-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-lg font-bold text-red-600">
              {stats.expired}
            </div>
            <p className="text-xs text-muted-foreground">vencidos</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 sm:col-span-2 lg:col-span-1 dark:border-[#343434] dark:bg-[#232323]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              Usos Totais
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-lg font-bold text-blue-600">
              {stats.totalUsage}
            </div>
            <p className="text-xs text-muted-foreground">utilizações</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="overflow-hidden dark:border-[#343434] dark:bg-[#232323]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Campo de busca */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros de Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão limpar filtros - só mostra se há filtros ativos */}
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setTypeFilter('all')
                  }}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de cupons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Cupons ({filteredCoupons.length})
          </h2>
        </div>

        {filteredCoupons.length === 0 ? (
          <Card className="dark:border-[#343434] dark:bg-[#232323]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum cupom encontrado
              </h3>
              <p className="text-muted-foreground text-center">
                {coupons.length === 0
                  ? 'Quando houver cupons, eles aparecerão aqui.'
                  : 'Tente ajustar os filtros para encontrar o cupom que você está procurando.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onEdit={handleEditCoupon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulários */}
      <CouponForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleFormSuccess}
      />

      <CouponForm
        open={!!editingCoupon}
        onOpenChange={(open) => !open && setEditingCoupon(null)}
        coupon={editingCoupon}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
