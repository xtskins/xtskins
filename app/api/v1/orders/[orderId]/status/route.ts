import { buildSkinDisplayForOrderItem } from '@/lib/server/orders/orderItemSkinDisplay'
import {
  type CatalogPriceRow,
  type SkinPriceRow,
} from '@/lib/server/orders/resolveOrderLines'
import { getSupabaseServiceRoleKey } from '@/lib/supabase/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  updateOrderStatusSchema,
  orderSchema,
  ApiResponse,
  Order,
} from '@/lib/types/order'
import { z } from 'zod'

// PATCH - Atualizar status do pedido (apenas admins)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  try {
    const params = await context.params
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

    const { orderId } = params
    const body = await req.json()
    const validatedData = updateOrderStatusSchema.parse(body)

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
              'Acesso negado. Apenas administradores podem atualizar status de pedidos.',
            code: 'FORBIDDEN',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verificar se o pedido existe
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !existingOrder) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Pedido não encontrado',
            code: 'NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Atualizar status do pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: validatedData.status })
      .eq('id', orderId)

    if (updateError) {
      console.error('Erro ao atualizar status do pedido:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao atualizar status do pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar o pedido atualizado usando queries separadas
    const { data: updatedOrder, error: fetchError } = await supabase
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
      .eq('id', orderId)
      .single()

    if (fetchError || !updatedOrder) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar pedido atualizado',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar order_items do pedido
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
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Erro ao buscar itens do pedido:', itemsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar itens do pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar skins e usuário usando service_role para contornar RLS
    const supabaseService = createServerSupabaseClient(
      getSupabaseServiceRoleKey()!,
    )

    const skinIds =
      orderItems?.map((item) => item.skin_id).filter(Boolean) as string[]
    const catalogIds =
      orderItems?.map((item) => item.catalog_item_id).filter(Boolean) as string[]

    const [skinsResult, catalogsResult, userResult] = await Promise.all([
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
      supabaseService
        .from('users')
        .select(
          `
          id,
          email,
          name
        `,
        )
        .eq('id', updatedOrder.user_id)
        .single(),
    ])

    if (skinsResult.error || catalogsResult.error) {
      console.error(
        'Erro ao buscar itens:',
        skinsResult.error,
        catalogsResult.error,
      )
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar dados dos itens',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (userResult.error) {
      console.error('Erro ao buscar usuário:', userResult.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar usuário',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const skinsMap = new Map(
      (skinsResult.data as SkinPriceRow[] | null)?.map((skin) => [
        skin.id,
        skin,
      ]) || [],
    )
    const catalogsMap = new Map(
      (catalogsResult.data as CatalogPriceRow[] | null)?.map((c) => [
        c.id,
        c,
      ]) || [],
    )

    const transformedOrder = {
      ...updatedOrder,
      customer: userResult.data || {
        id: updatedOrder.user_id,
        email: 'Email não encontrado',
        name: 'Nome não encontrado',
      },
      items: (orderItems || []).map((item) => ({
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

    const validatedOrder = orderSchema.parse(transformedOrder)

    const result: ApiResponse<Order> = {
      success: true,
      data: validatedOrder,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error)

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

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
