-- Corrigir função validate_coupon para resolver ambiguidade de coupon_id
CREATE OR REPLACE FUNCTION validate_coupon(
    p_coupon_code TEXT,
    p_user_id UUID,
    p_order_amount DECIMAL DEFAULT 0
)
RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_type coupon_type,
    discount_value DECIMAL,
    max_discount DECIMAL,
    error_message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_user_usage_count INTEGER;
BEGIN
    -- Buscar cupom
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_coupon_code)
    AND status = 'active';
    
    -- Verificar se cupom existe
    IF v_coupon IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 'Cupom não encontrado ou inativo';
        RETURN;
    END IF;
    
    -- Verificar validade por data
    IF v_coupon.start_date > NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 'Cupom ainda não está válido';
        RETURN;
    END IF;
    
    IF v_coupon.end_date IS NOT NULL AND v_coupon.end_date < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 'Cupom expirado';
        RETURN;
    END IF;
    
    -- Verificar limite de uso total
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 'Cupom esgotado';
        RETURN;
    END IF;
    
    -- Verificar valor mínimo do pedido
    IF p_order_amount < v_coupon.min_order_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 
            'Valor mínimo da compra não atingido (R$ ' || v_coupon.min_order_amount || ')';
        RETURN;
    END IF;
    
    -- Verificar limite de uso por usuário (corrigindo ambiguidade)
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.coupon_usage cu
    WHERE cu.coupon_id = v_coupon.id AND cu.user_id = p_user_id;
    
    IF v_user_usage_count >= v_coupon.usage_limit_per_user THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::coupon_type, NULL::DECIMAL, NULL::DECIMAL, 'Você já utilizou este cupom o máximo de vezes permitidas';
        RETURN;
    END IF;
    
    -- Cupom é válido
    RETURN QUERY SELECT TRUE, v_coupon.id, v_coupon.type, v_coupon.value, v_coupon.max_discount_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 