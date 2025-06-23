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

    // Transformar dados para o formato esperado
    const transformedOrders = orders.map((order) => ({
      ...order,
      items: order.order_items.map((item: Record<string, unknown>) => ({
        ...item,
        skin: item.skin,
      })),
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
