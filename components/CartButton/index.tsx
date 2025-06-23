'use client'

import { ShoppingCart, PackageOpen, Trash2, LogIn, User } from 'lucide-react'
import { useState } from 'react'
import { useOrder } from '@/context/OrderContext'
import { useAuth } from '@/context/AuthContext'
import { useOrderActions } from '@/hooks/useOrders'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { toast } from 'sonner'

interface CartButtonProps {
  onClick?: () => void
}

export function CartButton({ onClick }: CartButtonProps) {
  const {
    orderState,
    removeFromCart,
    clearCart,
    createOrder,
    isCreatingOrder,
  } = useOrder()
  const { user, signInWithGoogle } = useAuth()
  const { validateCoupon } = useOrderActions()
  const { executeRecaptchaAction } = useRecaptcha()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    discount_type?: string
    discount_amount?: number
    coupon_id?: string
    max_discount?: number
  } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authReason, setAuthReason] = useState<'purchase' | 'coupon'>(
    'purchase',
  )
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return

    if (!user) {
      toast.info('Você precisa estar logado para aplicar cupom')
      setIsSheetOpen(false)

      setTimeout(() => {
        setAuthReason('coupon')
        setShowAuthDialog(true)
      }, 300)
      return
    }

    setIsValidatingCoupon(true)

    try {
      const recaptchaToken = await executeRecaptchaAction('validate_coupon')

      const result = await validateCoupon({
        couponCode,
        orderAmount: orderState.totalValue,
        recaptchaToken,
      })

      if (result.data) {
        setAppliedCoupon({
          code: couponCode,
          discount: result.data.discount_value,
          discount_type: result.data.discount_type,
          discount_amount: result.data.discount_amount,
          coupon_id: result.data.coupon_id,
          max_discount: result.data.max_discount,
        })
        toast.success('Cupom aplicado com sucesso!')
      }
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const handleCreateOrder = async () => {
    if (!user) {
      setIsSheetOpen(false)
      setTimeout(() => {
        setAuthReason('purchase')
        setShowAuthDialog(true)
      }, 300)
      return
    }

    try {
      await createOrder(appliedCoupon?.code)
      toast.success('Pedido criado com sucesso!')

      openWhatsAppMessage()

      setIsSheetOpen(false)
    } catch (error) {
      toast.error('Erro ao criar pedido: ' + (error as Error).message)
    }
  }

  const openWhatsAppMessage = () => {
    const whatsappNumber = '353870015714'

    const itemsList = orderState.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.marketname} - R$ ${parseFloat(item.discount_price).toFixed(2)}`,
      )
      .join('\n')

    const subtotal = orderState.totalValue
    const desconto =
      orderState.totalDiscount + (appliedCoupon?.discount_amount || 0)
    const total = finalPrice

    const message = `Olá! 👋

Acabei de fazer uma compra no site e gostaria de saber os próximos passos.

📋 *Detalhes do Pedido:*
${itemsList}

💰 *Resumo Financeiro:*
• Subtotal: R$ ${subtotal.toFixed(2)}
${desconto > 0 ? `• Desconto: -R$ ${desconto.toFixed(2)}\n` : ''}• *Total: R$ ${total.toFixed(2)}*

${appliedCoupon ? `🎫 Cupom aplicado: ${appliedCoupon.code}\n` : ''}
Aguardo instruções sobre como proceder com o pagamento e entrega.

Obrigado! 😊`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleLoginAndContinue = async () => {
    try {
      await signInWithGoogle()
      setShowAuthDialog(false)
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      toast.error('Erro ao fazer login. Tente novamente.')
    }
  }

  const discountAmount = appliedCoupon?.discount_amount || 0

  const finalPrice = orderState.totalValue - discountAmount

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="relative cursor-pointer" onClick={onClick}>
            <ShoppingCart className="h-4 w-4" />
            {orderState.totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white duration-200 animate-in zoom-in">
                {orderState.totalItems > 99 ? '99+' : orderState.totalItems}
              </span>
            )}
          </div>
        </SheetTrigger>
        <SheetContent
          className="z-[99999] flex w-full flex-col gap-0 p-0 dark:border-[#343434] dark:bg-[#1c1c1c] sm:max-w-lg h-full"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="flex h-12 justify-center px-6 gap-0 flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Carrinho
            </SheetTitle>
            {orderState.totalItems > 0 && (
              <p className="text-start text-xs text-muted-foreground">
                {orderState.totalItems}{' '}
                {orderState.totalItems === 1 ? 'item' : 'itens'} no carrinho
              </p>
            )}
          </SheetHeader>
          <Separator className="dark:border-[#343434] flex-shrink-0" />
          <ScrollArea className="flex-1 min-h-0">
            {orderState.items.length === 0 ? (
              <div className="flex h-[50vh] flex-col items-center justify-center gap-4 p-6">
                <div className="relative">
                  <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/10" />
                  <div className="relative rounded-full bg-primary/10 p-6">
                    <PackageOpen className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-semibold">Seu carrinho está vazio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adicione skins para começar suas compras
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col divide-y dark:divide-[#343434]">
                {orderState.items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-start gap-3 p-4 sm:p-6 transition-colors hover:bg-muted/50 dark:hover:bg-[#242424] sm:items-center"
                  >
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
                      <Image
                        src={item.image}
                        alt={item.marketname}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <span className="text-sm font-medium leading-tight line-clamp-2 sm:flex-1">
                          {item.marketname}
                        </span>
                        <div className="flex flex-col items-start sm:items-end gap-0.5">
                          {parseFloat(item.price) !==
                            parseFloat(item.discount_price) && (
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {parseFloat(item.price).toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-semibold tracking-tight text-green-500">
                            R$ {parseFloat(item.discount_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs flex-wrap">
                        {item.rarity && (
                          <span
                            className="font-semibold capitalize"
                            style={{ color: `#${item.color}` }}
                          >
                            {item.rarity}
                          </span>
                        )}
                        {item.wear && (
                          <span className="text-muted-foreground">
                            • {item.wear.toUpperCase()}
                          </span>
                        )}
                        {item.float_value && (
                          <span className="text-muted-foreground">
                            • {item.float_value.toFixed(4)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 transition-opacity group-hover:opacity-100 cursor-pointer"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Remover item</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {orderState.items.length > 0 && (
            <div className="border-t p-4 sm:p-6 dark:border-[#343434] flex-shrink-0 mt-auto">
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <dt className="text-sm">Subtotal</dt>
                  <dd className="text-sm font-medium">
                    R$ {orderState.originalValue.toFixed(2)}
                  </dd>
                </div>

                {orderState.totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <dt className="text-sm">Desconto das skins</dt>
                    <dd className="text-sm font-medium text-green-500">
                      -R$ {orderState.totalDiscount.toFixed(2)}
                    </dd>
                  </div>
                )}

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="coupon" className="border-none">
                    <AccordionTrigger className="py-0 text-sm text-muted-foreground hover:no-underline">
                      Possui cupom?
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <Input
                            placeholder="Digite seu cupom"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            className="pr-20 sm:pr-24 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <Button
                            size="sm"
                            className="absolute right-0 top-0 h-full rounded-l-none cursor-pointer text-xs sm:text-sm"
                            onClick={
                              appliedCoupon
                                ? handleRemoveCoupon
                                : handleValidateCoupon
                            }
                            disabled={
                              (!couponCode && !appliedCoupon) ||
                              isValidatingCoupon
                            }
                          >
                            {isValidatingCoupon ? (
                              <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : appliedCoupon ? (
                              <span className="text-white">Remover</span>
                            ) : (
                              <span className="text-white">Aplicar</span>
                            )}
                          </Button>
                        </div>
                        {appliedCoupon && (
                          <p className="text-xs text-green-500">
                            Cupom de desconto aplicado com sucesso 🎉
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <dt className="text-sm">
                      Desconto cupom{' '}
                      {appliedCoupon.discount_type === 'percentage'
                        ? `(${appliedCoupon.discount}%)`
                        : `(R$ ${appliedCoupon.discount.toFixed(2)})`}
                    </dt>
                    <dd className="text-sm font-medium text-green-500">
                      -R$ {discountAmount.toFixed(2)}
                    </dd>
                  </div>
                )}

                <Separator className="my-2 dark:border-[#343434]" />
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium">Total</dt>
                  <dd className="text-sm font-semibold text-green-500">
                    R$ {finalPrice.toFixed(2)}
                  </dd>
                </div>

                {(orderState.totalDiscount > 0 || appliedCoupon) && (
                  <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 text-center">
                      💰 Você está economizando R${' '}
                      {(orderState.totalDiscount + discountAmount).toFixed(2)}
                    </p>
                  </div>
                )}
              </dl>
              <div className="mt-4 sm:mt-6 space-y-3">
                <Button
                  className="relative w-full overflow-hidden bg-primary text-white transition-colors hover:bg-primary/90 dark:bg-primary/90 dark:hover:bg-primary/80"
                  size="lg"
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || orderState.items.length === 0}
                >
                  {isCreatingOrder ? 'Criando Pedido...' : 'Finalizar Pedido'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full dark:hover:bg-[#242424]"
                  onClick={clearCart}
                >
                  Limpar Carrinho
                </Button>

                <p className="text-xs text-muted-foreground text-center px-2">
                  Este site é protegido pelo reCAPTCHA e as{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Políticas de Privacidade
                  </a>{' '}
                  e{' '}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Termos de Serviço
                  </a>{' '}
                  do Google se aplicam.
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="w-[90%] max-w-sm sm:max-w-md mx-auto">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
                Faça Login para Continuar
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm px-2">
                {authReason === 'coupon'
                  ? 'Entre com sua conta Google para aplicar cupons e aproveitar descontos especiais'
                  : 'Entre com sua conta Google para finalizar a compra das suas skins favoritas'}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl p-3 sm:p-4 border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      Seu Carrinho
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {orderState.totalItems}{' '}
                      {orderState.totalItems === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm sm:text-lg font-bold text-green-500">
                    R$ {finalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {(orderState.totalDiscount > 0 || appliedCoupon) && (
                <div className="mt-2 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="text-xs">💰</span>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium text-center">
                    Economia de R${' '}
                    {(
                      orderState.totalDiscount +
                      (appliedCoupon
                        ? (orderState.totalValue * appliedCoupon.discount) / 100
                        : 0)
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="!flex !flex-col gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAuthDialog(false)}
                className="flex-1 text-sm"
              >
                Continuar Navegando
              </Button>
              <Button
                onClick={handleLoginAndContinue}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 shadow-lg text-sm"
              >
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {authReason === 'coupon' ? 'Fazer Login' : 'Entrar com Google'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-1 leading-tight">
              Este site é protegido pelo reCAPTCHA e as{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Políticas de Privacidade
              </a>{' '}
              e{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Termos de Serviço
              </a>{' '}
              do Google se aplicam.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
