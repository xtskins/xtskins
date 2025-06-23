'use client'

import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { Skin } from '@/lib/types/skin'
import { useOrderActions } from '@/hooks/useOrders'
import { CreateOrderInput } from '@/lib/types/order'

interface SkinCartItem extends Skin {
  addedAt: Date
}

interface OrderState {
  items: SkinCartItem[]
  totalItems: number
  totalValue: number
  totalDiscount: number
  originalValue: number
}

interface OrderContextType {
  orderState: OrderState
  addToCart: (skin: Skin) => void
  removeFromCart: (skinId: string) => void
  clearCart: () => void
  isInCart: (skinId: string) => boolean
  getCartItem: (skinId: string) => SkinCartItem | undefined
  createOrder: (couponCode?: string) => Promise<void>
  isCreatingOrder: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

interface OrderProviderProps {
  children: React.ReactNode
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [items, setItems] = useState<SkinCartItem[]>([])
  const { createOrder: createOrderApi, isCreating: isCreatingOrder } =
    useOrderActions()

  // Carregar itens do localStorage na inicialização
  useEffect(() => {
    const savedCart = localStorage.getItem('xtskins-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Converter strings de data de volta para objetos Date
        const itemsWithDates = parsedCart.map(
          (item: SkinCartItem & { addedAt: string }) => ({
            ...item,
            addedAt: new Date(item.addedAt),
          }),
        )
        setItems(itemsWithDates)
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error)
        localStorage.removeItem('xtskins-cart')
      }
    }
  }, [])

  // Salvar no localStorage sempre que os itens mudarem
  useEffect(() => {
    localStorage.setItem('xtskins-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (skin: Skin) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === skin.id)

      if (existingItem) {
        // Se já existe, não adiciona novamente
        return prevItems
      } else {
        // Se não existe, adiciona novo item
        return [
          ...prevItems,
          {
            ...skin,
            addedAt: new Date(),
          },
        ]
      }
    })
  }

  const removeFromCart = (skinId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== skinId))
  }

  const clearCart = () => {
    setItems([])
  }

  const isInCart = (skinId: string) => {
    return items.some((item) => item.id === skinId)
  }

  const getCartItem = (skinId: string) => {
    return items.find((item) => item.id === skinId)
  }

  const createOrder = async (couponCode?: string) => {
    if (items.length === 0) {
      throw new Error('Carrinho está vazio')
    }

    const orderData: CreateOrderInput = {
      items: items.map((item) => ({
        skin_id: item.id,
        quantity: 1, // Por enquanto sempre 1, mas pode ser expandido
      })),
      coupon_code: couponCode,
    }

    try {
      await createOrderApi(orderData)
      // Limpar carrinho após pedido bem-sucedido
      clearCart()
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      throw error
    }
  }

  const orderState = useMemo(() => {
    const totalItems = items.length

    const totalValue = items.reduce((sum, item) => {
      const discountPrice = parseFloat(item.discount_price)
      return sum + discountPrice
    }, 0)

    const originalValue = items.reduce((sum, item) => {
      const originalPrice = parseFloat(item.price)
      return sum + originalPrice
    }, 0)

    const totalDiscount = originalValue - totalValue

    return {
      items,
      totalItems,
      totalValue,
      totalDiscount,
      originalValue,
    }
  }, [items])

  const value = {
    orderState,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartItem,
    createOrder,
    isCreatingOrder,
  }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
