import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
import { buildSkinDisplayForOrderItem } from '@/lib/server/orders/orderItemSkinDisplay'
import {
  resolveProductLines,
  unitPriceFromLine,
  listPriceFromLine,
  type SkinPriceRow,
  type CatalogPriceRow,
} from '@/lib/server/orders/resolveOrderLines'
import {
  createOrderSchema,
  orderSchema,
  ApiResponse,
  Order,
} from '@/lib/types/order'
import { z } from 'zod'

// POST - Criar um novo pedido
export async function POST(req: Request): Promise<Response> {
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

    const body = await req.json()
    const validatedData = createOrderSchema.parse(body)

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

    // skin_id no payload = id da linha na vitrine (skins OU catalog_items)
    const productIds = validatedData.items.map((item) => item.skin_id)

    const supabaseAdmin = createClient(
      getSupabaseUrl()!,
      getSupabaseServiceRoleKey()!,
    )

    const [{ data: skins, error: skinsError }, { data: catalogs, error: catError }] =
      await Promise.all([
        supabaseAdmin
          .from('skins')
          .select(
            'id, markethashname, image, wear, discount_price, price, tradable, isstattrak, issouvenir',
          )
          .in('id', productIds)
          .eq('is_visible', true),
        supabaseAdmin
          .from('catalog_items')
          .select(
            'id, markethashname, marketname, image, wear, list_price, discount_price',
          )
          .in('id', productIds)
          .eq('is_visible', true),
      ])

    if (skinsError || catError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar itens da vitrine',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { map: lineMap, missing } = resolveProductLines(
      productIds,
      (skins || []) as SkinPriceRow[],
      (catalogs || []) as CatalogPriceRow[],
    )

    if (missing.length > 0) {
      console.error('Itens não encontrados na vitrine:', { missing })
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Um ou mais itens não foram encontrados ou não estão visíveis. IDs: ${missing.join(', ')}`,
            code: 'VALIDATION_ERROR',
            details: { missingIds: missing },
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const skinRowsMap = new Map<string, SkinPriceRow>()
    const catalogRowsMap = new Map<string, CatalogPriceRow>()
    for (const line of lineMap.values()) {
      if (line.kind === 'skin') skinRowsMap.set(line.row.id, line.row)
      else catalogRowsMap.set(line.row.id, line.row)
    }

    // Calcular valores
    let totalAmount = 0
    let discountAmount = 0

    // Validar cupom se fornecido
    let couponData: {
      coupon_id: string
      discount_type: 'percentage' | 'fixed_amount'
      discount_value: number
      discount_amount: number
    } | null = null

    if (validatedData.coupon_code) {
      // Usar service_role_key para validar cupom
      const supabaseAdmin = createClient(
        getSupabaseUrl()!,
        getSupabaseServiceRoleKey()!,
      )

      // Calcular o total sem cupom primeiro
      let subtotal = 0
      validatedData.items.forEach((item) => {
        const line = lineMap.get(item.skin_id)!
        subtotal += unitPriceFromLine(line) * item.quantity
      })

      // Validar cupom com o valor do pedido
      const { data: validationResult, error: validationError } =
        (await supabaseAdmin
          .rpc('validate_coupon', {
            p_coupon_code: validatedData.coupon_code,
            p_user_id: userData.user.id,
            p_order_amount: subtotal,
          })
          .single()) as {
          data: {
            is_valid: boolean
            coupon_id: string
            discount_type: 'percentage' | 'fixed_amount'
            discount_value: number
            max_discount: number | null
            error_message: string | null
          } | null
          error: Error | null
        }

      if (validationError || !validationResult?.is_valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: validationResult?.error_message || 'Cupom inválido',
              code: 'INVALID_COUPON',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // Calcular desconto do cupom
      let discountAmount = 0
      if (validationResult.discount_type === 'percentage') {
        discountAmount = (subtotal * validationResult.discount_value) / 100
        // Aplicar limite máximo se existir
        if (
          validationResult.max_discount &&
          discountAmount > validationResult.max_discount
        ) {
          discountAmount = validationResult.max_discount
        }
      } else if (validationResult.discount_type === 'fixed_amount') {
        discountAmount = Math.min(validationResult.discount_value, subtotal)
      }

      couponData = {
        coupon_id: validationResult.coupon_id,
        discount_type: validationResult.discount_type,
        discount_value: validationResult.discount_value,
        discount_amount: discountAmount,
      }
    }

    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        status: 'pending',
        coupon_code: validatedData.coupon_code || null,
        coupon_discount_percent:
          couponData?.discount_type === 'percentage'
            ? couponData.discount_value
            : null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao criar pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Criar os itens do pedido
    const orderItems = validatedData.items.map((item) => {
      const line = lineMap.get(item.skin_id)!
      const unitPrice = unitPriceFromLine(line)
      const itemTotal = unitPrice * item.quantity

      totalAmount += itemTotal

      const originalPrice = listPriceFromLine(line)
      const salePrice = unitPrice
      if (originalPrice > salePrice) {
        discountAmount += (originalPrice - salePrice) * item.quantity
      }

      return {
        order_id: order.id,
        skin_id: line.kind === 'skin' ? line.row.id : null,
        catalog_item_id: line.kind === 'catalog' ? line.row.id : null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Reverter criação do pedido se houver erro nos itens
      await supabase.from('orders').delete().eq('id', order.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao criar itens do pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Calcular desconto do cupom
    const couponDiscountAmount = couponData ? couponData.discount_amount : 0
    const finalDiscountAmount = discountAmount + couponDiscountAmount
    const finalTotalAmount = totalAmount - couponDiscountAmount

    // Atualizar valores finais do pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        total_amount: finalTotalAmount,
        discount_amount: finalDiscountAmount,
      })
      .eq('id', order.id)

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao atualizar valores do pedido',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Registrar uso do cupom se aplicado
    if (couponData) {
      const supabaseAdmin = createClient(
        getSupabaseUrl()!,
        getSupabaseServiceRoleKey()!,
      )

      // Registrar uso do cupom
      const { error: couponUsageError } = await supabaseAdmin
        .from('coupon_usage')
        .insert({
          coupon_id: couponData.coupon_id,
          user_id: userData.user.id,
          order_id: order.id,
          discount_amount: couponData.discount_amount,
        })

      if (couponUsageError) {
        console.error('Erro ao registrar uso do cupom:', couponUsageError)
        // Não falhar o pedido por causa disso, apenas registrar o erro
      }

      // Incrementar contador de uso do cupom
      const { error: incrementError } = await supabaseAdmin.rpc(
        'increment_coupon_usage',
        {
          coupon_id: couponData.coupon_id,
        },
      )

      if (incrementError) {
        console.error('Erro ao incrementar contador do cupom:', incrementError)
        // Não falhar o pedido por causa disso, apenas registrar o erro
      }
    }

    // Buscar dados do cliente
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userData.user.id)
      .single()

    if (customerError || !customerData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar dados do cliente',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Buscar itens do pedido criados
    const { data: createdOrderItems, error: fetchItemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (fetchItemsError || !createdOrderItems) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar itens do pedido criado',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const itemsWithSkins = createdOrderItems.map((item) => ({
      ...item,
      skin: buildSkinDisplayForOrderItem(
        {
          skin_id: item.skin_id,
          catalog_item_id: item.catalog_item_id,
        },
        skinRowsMap,
        catalogRowsMap,
      ),
    }))

    // Buscar pedido atualizado
    const { data: finalOrder, error: finalOrderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single()

    if (finalOrderError || !finalOrder) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Erro ao buscar pedido final',
            code: 'DATABASE_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Construir pedido completo
    const transformedOrder = {
      ...finalOrder,
      items: itemsWithSkins,
      customer: customerData,
    }

    const validatedOrder = orderSchema.parse(transformedOrder)

    const result: ApiResponse<Order> = {
      success: true,
      data: validatedOrder,
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)

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
