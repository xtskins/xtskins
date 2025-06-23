'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MoreHorizontal,
  Calendar,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  Copy,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Coupon } from '@/lib/types/coupon'
import { useCouponActions } from '@/hooks/useCoupons'
import { toast } from 'sonner'

interface CouponCardProps {
  coupon: Coupon
  onEdit: (coupon: Coupon) => void
}

const lineClampStyles = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

export function CouponCard({ coupon, onEdit }: CouponCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { deleteCoupon, updateCoupon, isDeleting, isUpdating } =
    useCouponActions()

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code)
    toast.success('Código copiado para a área de transferência!')
  }

  const handleDelete = async () => {
    try {
      await deleteCoupon(coupon.id)
      toast.success('Cupom deletado com sucesso!')
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleToggleStatus = async () => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active'
      await updateCoupon({
        couponId: coupon.id,
        couponData: { status: newStatus },
      })
      toast.success(
        `Cupom ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`,
      )
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'inactive':
        return 'Inativo'
      case 'expired':
        return 'Expirado'
      default:
        return 'Desconhecido'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const usagePercentage = coupon.usage_limit
    ? (coupon.used_count / coupon.usage_limit) * 100
    : 0

  const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date()
  const isExhausted =
    coupon.usage_limit && coupon.used_count >= coupon.usage_limit

  return (
    <>
      <Card
        className={`flex flex-col h-full transition-all hover:shadow-lg border dark:border-[#343434] dark:bg-[#232323] ${
          coupon.status !== 'active' ? 'opacity-75 bg-muted/30' : 'bg-card'
        } ${isExpired || isExhausted ? 'border-destructive/20' : ''}`}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 px-4 pt-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-auto -ml-1 text-base font-bold hover:bg-muted/50 rounded-md max-w-full justify-start has-[>svg]:px-[5px]"
              >
                <span className="truncate">{coupon.code}</span>
                <Copy className="ml-2 h-3 w-3 flex-shrink-0" />
              </Button>
            </CardTitle>
            <CardDescription className="mt-1 text-xs" style={lineClampStyles}>
              {coupon.name}
            </CardDescription>
          </div>
          <div className="flex items-start gap-2 flex-shrink-0 ml-2">
            <Badge
              className={`text-xs px-2 py-1 ${getStatusColor(coupon.status)}`}
            >
              {getStatusText(coupon.status)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(coupon)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleStatus}
                  disabled={isUpdating}
                >
                  {coupon.status === 'active' ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col h-full px-4 pb-4 pt-0">
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {coupon.type === 'percentage' ? (
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-md">
                    <Percent className="h-3 w-3 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {coupon.value}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-md">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      R$ {coupon.value.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {coupon.max_discount_amount && coupon.type === 'percentage' && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  máx. R$ {coupon.max_discount_amount.toFixed(2)}
                </span>
              )}
            </div>

            {coupon.description && (
              <div className="bg-input/30 rounded-md p-2">
                <p
                  className="text-xs text-muted-foreground"
                  style={lineClampStyles}
                >
                  {coupon.description}
                </p>
              </div>
            )}

            {/* Informações de uso */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-input/20 rounded-md">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Usos:</span>
                </div>
                <span className="font-semibold">
                  {coupon.used_count}
                  {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-input/20 rounded-md">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Pedido mín.:</span>
                </div>
                <span className="font-semibold">
                  R$ {coupon.min_order_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {coupon.usage_limit && (
              <div className="space-y-2 p-2 bg-muted/10 rounded-md">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Progresso de uso
                  </span>
                  <span className="font-semibold">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercentage > 80
                        ? 'bg-red-500'
                        : usagePercentage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-input/20 p-2 rounded-md">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {formatDate(coupon.start_date)}
                {coupon.end_date && <> até {formatDate(coupon.end_date)}</>}
              </span>
            </div>

            {(isExpired || isExhausted) && (
              <div className="flex flex-wrap gap-1">
                {isExpired && (
                  <Badge variant="destructive" className="text-xs px-2 py-1">
                    Expirado
                  </Badge>
                )}
                {isExhausted && (
                  <Badge variant="destructive" className="text-xs px-2 py-1">
                    Esgotado
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Cupom</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o cupom{' '}
              <strong>{coupon.code}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
