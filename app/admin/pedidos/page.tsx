'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package2, User, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useAllOrders, useOrderActions } from '@/hooks/useOrders'
import { Order as OrderType } from '@/lib/types/order'
import { toast } from 'sonner'

const orderStatusMap = {
  pending: {
    label: 'Pendente',
    color: 'yellow',
    className:
      'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-400',
  },
  completed: {
    label: 'Concluído',
    color: 'green',
    className:
      'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-400',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'red',
    className: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-400',
  },
}

const StatusDot = ({ color }: { color: string }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-500'
      case 'blue':
        return 'bg-blue-500'
      case 'purple':
        return 'bg-purple-500'
      case 'green':
        return 'bg-green-500'
      case 'red':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const colorClass = getColorClasses()

  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          colorClass,
        )}
      />
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', colorClass)}
      />
    </span>
  )
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const OrderCard = ({ order }: { order: OrderType }) => {
  const { updateOrderStatus, isUpdatingStatus } = useOrderActions()
  const isCancelled = order.status === 'cancelled'

  return (
    <Card className="flex w-full min-w-0 flex-col dark:border-[#343434] dark:bg-[#232323]">
      <CardHeader className="flex flex-row gap-2 pb-4 justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">
              Pedido #{order.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`flex w-fit items-center gap-2 ${orderStatusMap[order.status].className}`}
        >
          <StatusDot color={orderStatusMap[order.status].color} />
          <span className="text-xs font-medium">
            {orderStatusMap[order.status].label}
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src={item.skin.image}
                  alt={item.skin.markethashname}
                  fill
                  className="rounded object-cover"
                />
                {item.skin.isstattrak && (
                  <div className="absolute -top-1 -right-1 rounded-full bg-orange-500 px-1 text-xs text-white">
                    ST
                  </div>
                )}
                {item.skin.issouvenir && (
                  <div className="absolute -top-1 -right-1 rounded-full bg-yellow-500 px-1 text-xs text-white">
                    S
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {item.quantity}x {item.skin.markethashname}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs uppercase">
                    {item.skin.wear}
                  </Badge>
                  {item.skin.tradable ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>
              <p className="shrink-0 text-xs font-medium tabular-nums">
                {formatCurrency(parseFloat(item.total_price))}
              </p>
            </div>
          ))}

          <Separator className="my-1" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Subtotal:</span>
              <span className="shrink-0 text-xs tabular-nums">
                {formatCurrency(
                  order.items.reduce(
                    (acc, item) => acc + parseFloat(item.total_price),
                    0,
                  ),
                )}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Desconto aplicado:</span>
                <span className="shrink-0 tabular-nums text-green-600 dark:text-green-400">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total:</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-4">
        <div className="flex w-full flex-col gap-2 rounded-lg border p-4 dark:border-[#343434]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h4 className="min-w-0 truncate text-sm font-medium max-[420px]:hidden">
              Informações do Cliente
            </h4>
            <h4 className="hidden text-xs max-[420px]:block">Cliente</h4>
          </div>
          <div className="flex flex-col gap-1">
            <p className="truncate text-xs font-medium">
              {order.customer.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customer.email}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {order.customer.id.slice(0, 8)}
            </p>

            {!isCancelled && (
              <div className="mt-2">
                <select
                  className="w-full rounded border p-1 text-sm disabled:opacity-50 dark:border-[#343434] dark:bg-[#1c1c1c]"
                  value={order.status}
                  disabled={isUpdatingStatus}
                  onChange={async (e) => {
                    try {
                      await updateOrderStatus({
                        orderId: order.id,
                        statusData: {
                          status: e.target.value as
                            | 'pending'
                            | 'completed'
                            | 'cancelled',
                        },
                      })
                      toast.success('Status do pedido atualizado')
                    } catch (error) {
                      console.error(error)
                      toast.error('Erro ao atualizar status')
                    }
                  }}
                >
                  <option value="pending">Pendente</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function Pedidos() {
  const { data: orders, isLoading, error } = useAllOrders()

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-base font-bold">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie todos os pedidos de skins da plataforma
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 animate-pulse">
          {[...Array(9)].map((_, i) => (
            <Card
              key={i}
              className="flex w-full min-w-0 flex-col dark:border-[#343434] dark:bg-[#232323]"
            >
              <CardHeader className="flex flex-row gap-2 pb-4 justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-muted rounded shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-muted rounded w-12"></div>
                          <div className="h-3 w-3 bg-muted rounded-full"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded w-16 shrink-0"></div>
                    </div>
                  ))}

                  <Separator className="my-1" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-muted rounded w-16"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="mt-auto flex flex-col gap-4">
                <div className="flex w-full flex-col gap-2 rounded-lg border p-4 dark:border-[#343434]">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-full mt-2"></div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-base font-bold">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie todos os pedidos de skins da plataforma
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Erro ao carregar pedidos
          </h3>
          <p className="text-muted-foreground">
            Ocorreu um erro ao buscar os pedidos. Tente recarregar a página.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-base font-bold">Gerenciar Pedidos</h1>
        <p className="text-muted-foreground text-sm">
          Visualize e gerencie todos os pedidos de skins da plataforma
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {orders?.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>

      {(!orders || orders.length === 0) && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-muted-foreground">
            Quando houver pedidos, eles aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  )
}
