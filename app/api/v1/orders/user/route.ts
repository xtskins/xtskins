import { catalogRowToOrderSkinDisplay } from '@/lib/server/catalog/mapCatalogToSkin'
import {
  skinRowToOrderDisplay,
  type OrderItemSkinRow,
} from '@/lib/server/orders/orderItemSkinDisplay'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { orderSchema, ApiResponse, Order } from '@/lib/types/order'

// GET - Buscar pedidos do usuário
export async function GET(req: Request): Promise<Response> {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Token de acesso é obrigatório',
            code: 'VALIDATION_ERROR',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createServerSupabaseClient(accessToken)

    // Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Usuário não autenticado',
            code: 'UNAUTHORIZED',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar pedidos do usuário
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          skin:skins (
            id,
            markethashname,
            image,
            wear,
            discount_price,
            price,
            tradable,
            isstattrak,
            issouvenir
          ),
          catalog_item:catalog_items (
            id,
            markethashname,
            image,
            wear,
            list_price,
            discount_price
          )
        ),
        customer:users (
          id,
          email,
          name
        )
      `,
      )
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Erro ao buscar pedidos:', ordersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar pedidos',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const transformedOrders = orders.map((order) => ({
      ...order,
      items: order.order_items.map((item: Record<string, unknown>) => {
        const skin = item.skin as Record<string, unknown> | null
        const cat = item.catalog_item as Record<string, unknown> | null
        const displaySkin = skin
          ? skinRowToOrderDisplay(skin as OrderItemSkinRow)
          : cat
            ? catalogRowToOrderSkinDisplay({
                id: String(cat.id),
                markethashname: String(cat.markethashname),
                image: String(cat.image),
                wear: (cat.wear as string | null) ?? '',
                list_price: cat.list_price as string | number | null,
                discount_price: cat.discount_price as string | number | null,
              })
            : {
                id: String(item.skin_id ?? item.catalog_item_id ?? ''),
                markethashname: 'Item não encontrado',
                image: '/placeholder-skin.jpg',
                wear: '',
                price: '0',
                discount_price: '0',
                tradable: false,
                isstattrak: false,
                issouvenir: false,
              }

        return {
          id: item.id,
          order_id: item.order_id,
          skin_id: (item.skin_id as string | null) ?? null,
          catalog_item_id: (item.catalog_item_id as string | null) ?? null,
          quantity: item.quantity as number,
          unit_price: item.unit_price,
          total_price: item.total_price,
          created_at: item.created_at as string,
          skin: displaySkin,
        }
      }),
    }))

    // Remover order_items já que foi transformado em items
    transformedOrders.forEach((order) => {
      delete (order as Record<string, unknown>).order_items
    })

    const validatedOrders = transformedOrders.map((order) =>
      orderSchema.parse(order),
    )

    const result: ApiResponse<Order[]> = {
      success: true,
      data: validatedOrders,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
