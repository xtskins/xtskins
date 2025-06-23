'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tag,
  FileText,
  Percent,
  DollarSign,
  Calendar,
  Users,
  ShoppingCart,
  Clock,
  Settings,
} from 'lucide-react'
import { CreateCouponInput, Coupon } from '@/lib/types/coupon'
import { useCouponActions } from '@/hooks/useCoupons'
import { toast } from 'sonner'

interface CouponFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon?: Coupon | null
  onSuccess?: () => void
}

interface FormData
  extends Omit<
    CreateCouponInput,
    'max_discount_amount' | 'usage_limit' | 'end_date'
  > {
  max_discount_amount: string
  usage_limit: string
  end_date: string
}

export function CouponForm({
  open,
  onOpenChange,
  coupon,
  onSuccess,
}: CouponFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { createCoupon, updateCoupon } = useCouponActions()
  const isEditing = !!coupon

  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    max_discount_amount: '',
    min_order_amount: 0,
    usage_limit: '',
    usage_limit_per_user: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active',
  })

  // Preencher formulário quando editando
  useEffect(() => {
    if (coupon && open) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        max_discount_amount: coupon.max_discount_amount?.toString() || '',
        min_order_amount: coupon.min_order_amount,
        usage_limit: coupon.usage_limit?.toString() || '',
        usage_limit_per_user: coupon.usage_limit_per_user,
        start_date: coupon.start_date.split('T')[0],
        end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
        status: coupon.status === 'expired' ? 'inactive' : coupon.status,
      })
    } else if (!coupon && open) {
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        max_discount_amount: '',
        min_order_amount: 0,
        usage_limit: '',
        usage_limit_per_user: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
      })
    }
  }, [coupon, open])

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validações básicas
      if (!formData.code.trim()) {
        toast.error('Código do cupom é obrigatório')
        return
      }
      if (!formData.name.trim()) {
        toast.error('Nome do cupom é obrigatório')
        return
      }
      if (formData.value <= 0) {
        toast.error('Valor deve ser maior que zero')
        return
      }

      const payload: CreateCouponInput = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        max_discount_amount: formData.max_discount_amount
          ? Number(formData.max_discount_amount)
          : undefined,
        min_order_amount: formData.min_order_amount,
        usage_limit: formData.usage_limit
          ? Number(formData.usage_limit)
          : undefined,
        usage_limit_per_user: formData.usage_limit_per_user,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        status: formData.status,
      }

      if (isEditing && coupon) {
        await updateCoupon({
          couponId: coupon.id,
          couponData: payload,
        })
        toast.success('Cupom atualizado com sucesso!')
      } else {
        await createCoupon(payload)
        toast.success('Cupom criado com sucesso!')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto dark:border-[#343434] dark:bg-[#232323]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isEditing ? (
              <>
                <FileText className="h-5 w-5 text-blue-600" />
                Editar Cupom
              </>
            ) : (
              <>
                <Tag className="h-5 w-5 text-green-600" />
                Criar Novo Cupom
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="dark:border-[#343434] dark:bg-[#2a2a2a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Tag className="h-3 w-3" />
                    Código do Cupom
                  </Label>
                  <Input
                    id="code"
                    placeholder="DESCONTO10"
                    value={formData.code}
                    onChange={(e) =>
                      handleInputChange('code', e.target.value.toUpperCase())
                    }
                    className="font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-3 w-3" />
                    Nome do Cupom
                  </Label>
                  <Input
                    id="name"
                    placeholder="Desconto de 10%"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Descrição
                  <span className="text-xs text-muted-foreground">
                    (Opcional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do cupom para seus clientes..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  className="min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Desconto */}
          <Card className="dark:border-[#343434] dark:bg-[#2a2a2a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Configurações de Desconto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Tipo de Desconto
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentual (%)
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed_amount">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Valor Fixo (R$)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="value"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    {formData.type === 'percentage' ? (
                      <>
                        <Percent className="h-3 w-3" />
                        Percentual (%)
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3 w-3" />
                        Valor (R$)
                      </>
                    )}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    value={formData.value}
                    onChange={(e) =>
                      handleInputChange('value', Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>

              {formData.type === 'percentage' && (
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Label
                    htmlFor="max_discount_amount"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <DollarSign className="h-3 w-3 text-blue-600" />
                    Desconto Máximo (R$)
                    <span className="text-xs text-muted-foreground">
                      (Opcional)
                    </span>
                  </Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 50.00"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      handleInputChange('max_discount_amount', e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Limite máximo do desconto para cupons percentuais
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="min_order_amount"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <ShoppingCart className="h-3 w-3" />
                  Valor Mínimo do Pedido (R$)
                </Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    handleInputChange(
                      'min_order_amount',
                      Number(e.target.value),
                    )
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor mínimo que o pedido deve ter para aplicar o cupom
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limites de Uso */}
          <Card className="dark:border-[#343434] dark:bg-[#2a2a2a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Limites de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="usage_limit"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Users className="h-3 w-3" />
                    Limite Total
                    <span className="text-xs text-muted-foreground">
                      (Opcional)
                    </span>
                  </Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    placeholder="Ex: 100"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      handleInputChange('usage_limit', e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Total de usos permitidos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="usage_limit_per_user"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Users className="h-3 w-3" />
                    Por Usuário
                  </Label>
                  <Input
                    id="usage_limit_per_user"
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_user}
                    onChange={(e) =>
                      handleInputChange(
                        'usage_limit_per_user',
                        Number(e.target.value),
                      )
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Usos por usuário
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Período de Validade */}
          <Card className="dark:border-[#343434] dark:bg-[#2a2a2a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período de Validade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="start_date"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="h-3 w-3 text-green-600" />
                    Data de Início
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      handleInputChange('start_date', e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="end_date"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3 text-red-600" />
                    Data de Fim
                    <span className="text-xs text-muted-foreground">
                      (Opcional)
                    </span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      handleInputChange('end_date', e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para cupom sem data de expiração
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Cupom */}
          <Card className="dark:border-[#343434] dark:bg-[#2a2a2a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Status do Cupom
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border dark:border-[#343434] dark:bg-[#2a2a2a]">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Cupom Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Define se o cupom pode ser usado pelos clientes
                  </p>
                </div>
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) =>
                    handleInputChange('status', checked ? 'active' : 'inactive')
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[140px] text-white"
            >
              {isLoading
                ? isEditing
                  ? 'Atualizando...'
                  : 'Criando...'
                : isEditing
                  ? 'Atualizar Cupom'
                  : 'Criar Cupom'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
