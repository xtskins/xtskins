import { buildSkinDisplayForOrderItem } from '@/lib/server/orders/orderItemSkinDisplay'
import {
  type CatalogPriceRow,
  type SkinPriceRow,
} from '@/lib/server/orders/resolveOrderLines'
import { getSupabaseServiceRoleKey } from '@/lib/supabase/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { orderSchema, ApiResponse, Order } from '@/lib/types/order'

// GET - Buscar todos os pedidos (apenas admins)
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

    // Verificar se o usuário é admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message:
              'Acesso negado. Apenas administradores podem acessar este recurso.',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar todos os pedidos
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        status,
        total_amount,
        discount_amount,
        coupon_code,
        coupon_discount_percent,
        created_at,
        updated_at
      `,
      )
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

    if (!orders || orders.length === 0) {
      const result: ApiResponse<Order[]> = {
        success: true,
        data: [],
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Buscar order_items para cada pedido
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        id,
        order_id,
        skin_id,
        catalog_item_id,
        quantity,
        unit_price,
        total_price,
        created_at
      `,
      )
      .in(
        'order_id',
        orders.map((order) => order.id),
      )

    if (itemsError) {
      console.error('Erro ao buscar itens dos pedidos:', itemsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar itens dos pedidos',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar skins usando service_role para contornar RLS
    const supabaseService = createServerSupabaseClient(
      getSupabaseServiceRoleKey()!,
    )
    const skinIds =
      orderItems?.map((item) => item.skin_id).filter(Boolean) as string[]
    const catalogIds =
      orderItems?.map((item) => item.catalog_item_id).filter(Boolean) as string[]

    const [skinsResult, catalogsResult] = await Promise.all([
      skinIds.length
        ? supabaseService
            .from('skins')
            .select(
              `
        id,
        markethashname,
        image,
        wear,
        discount_price,
        price,
        tradable,
        isstattrak,
        issouvenir
      `,
            )
            .in('id', skinIds)
        : Promise.resolve({ data: [] as SkinPriceRow[], error: null }),
      catalogIds.length
        ? supabaseService
            .from('catalog_items')
            .select(
              'id, markethashname, marketname, image, wear, list_price, discount_price',
            )
            .in('id', catalogIds)
        : Promise.resolve({ data: [] as CatalogPriceRow[], error: null }),
    ])

    if (skinsResult.error || catalogsResult.error) {
      console.error('Erro ao buscar itens:', skinsResult.error, catalogsResult.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar dados dos itens do pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const skins = skinsResult.data || []
    const catalogs = catalogsResult.data || []

    // Buscar dados dos usuários
    const userIds = orders.map((order) => order.user_id)
    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select(
        `
        id,
        email,
        name
      `,
      )
      .in('id', userIds)

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar usuários',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const skinsMap = new Map(
      (skins as SkinPriceRow[]).map((skin) => [skin.id, skin]),
    )
    const catalogsMap = new Map(
      (catalogs as CatalogPriceRow[]).map((c) => [c.id, c]),
    )
    const usersMap = new Map(users?.map((user) => [user.id, user]) || [])

    // Transformar dados para o formato esperado
    const transformedOrders = orders.map((order) => {
      const orderItemsForOrder =
        orderItems?.filter((item) => item.order_id === order.id) || []
      const customer = usersMap.get(order.user_id)

      return {
        ...order,
        customer: customer || {
          id: order.user_id,
          email: 'Email não encontrado',
          name: 'Nome não encontrado',
        },
        items: orderItemsForOrder.map((item) => ({
          ...item,
          skin: buildSkinDisplayForOrderItem(
            {
              skin_id: item.skin_id,
              catalog_item_id: item.catalog_item_id,
            },
            skinsMap,
            catalogsMap,
          ),
        })),
      }
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
    console.error('Erro ao buscar todos os pedidos:', error)

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
