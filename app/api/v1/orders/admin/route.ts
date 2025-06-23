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
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const skinIds = orderItems?.map((item) => item.skin_id) || []

    const { data: skins, error: skinsError } = await supabaseService
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

    if (skinsError) {
      console.error('Erro ao buscar skins:', skinsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar skins',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

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

    // Criar maps para acesso rápido
    const skinsMap = new Map(skins?.map((skin) => [skin.id, skin]) || [])
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
        items: orderItemsForOrder.map((item) => {
          const skinData = skinsMap.get(item.skin_id)

          return {
            ...item,
            skin: skinData
              ? {
                  ...skinData,
                  price: String(skinData.price),
                  discount_price: String(skinData.discount_price),
                }
              : {
                  id: item.skin_id,
                  markethashname: 'Skin não encontrada',
                  image: '/placeholder-skin.jpg',
                  wear: 'Unknown',
                  price: '0',
                  discount_price: '0',
                  tradable: false,
                  isstattrak: false,
                  issouvenir: false,
                },
          }
        }),
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
