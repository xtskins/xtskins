-- ==================================================
-- MIGRAÇÃO: Criar tabela de cupons
-- Data: 2024
-- Descrição: Cria a tabela coupons para gerenciar cupons de desconto
-- ==================================================

-- Enum para definir os tipos de cupom
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount');

-- Enum para definir o status do cupom
CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired');

-- Criar a tabela de cupons
CREATE TABLE IF NOT EXISTS public.coupons (
    -- Identificador único
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Código do cupom (único e case-insensitive)
    code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Nome/descrição do cupom
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Tipo e valor do desconto
    type coupon_type NOT NULL DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL CHECK (value > 0), -- Valor em % ou R$
    
    -- Valor máximo de desconto (para cupons percentuais)
    max_discount_amount DECIMAL(10,2), -- Ex: cupom de 20% mas limitado a R$ 50
    
    -- Valor mínimo da compra para usar o cupom
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Controle de uso
    usage_limit INTEGER, -- NULL = ilimitado
    used_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1, -- Quantas vezes cada usuário pode usar
    
    -- Validade
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status coupon_status DEFAULT 'active',
    
    -- Audit fields
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_end_date_after_start_date 
        CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT check_max_discount_for_percentage 
        CHECK (type = 'fixed_amount' OR max_discount_amount IS NULL OR max_discount_amount > 0),
    CONSTRAINT check_usage_limit_positive 
        CHECK (usage_limit IS NULL OR usage_limit > 0),
    CONSTRAINT check_usage_limit_per_user_positive 
        CHECK (usage_limit_per_user > 0)
);

-- Tabela para rastrear uso de cupons por usuário
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL, -- Referência ao pedido (orders.id)
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas por usuário/cupom/pedido
    UNIQUE(coupon_id, user_id, order_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_start_date ON public.coupons(start_date);
CREATE INDEX IF NOT EXISTS idx_coupons_end_date ON public.coupons(end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON public.coupon_usage(order_id);

-- Função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para coupons
-- Todos podem ver cupons ativos (para validação)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (status = 'active');

-- Apenas admins podem inserir, atualizar e deletar cupons
CREATE POLICY "Only admins can manage coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Políticas RLS para coupon_usage
-- Usuários podem ver apenas seu próprio histórico de uso
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Apenas o sistema pode inserir registros de uso (via service role)
CREATE POLICY "System can insert coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (true); -- Será controlado via service role

-- Função para validar cupom
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
    
    -- Verificar limite de uso por usuário
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

-- Inserir alguns cupons de exemplo
INSERT INTO public.coupons (code, name, description, type, value, max_discount_amount, min_order_amount, usage_limit, created_by)
VALUES 
    ('DESCONTO10', 'Desconto de 10%', 'Cupom de desconto de 10% para qualquer compra', 'percentage', 10.00, NULL, 0, NULL, NULL),
    ('DESCONTO20', 'Desconto de 20%', 'Cupom de desconto de 20% com limite de R$ 100', 'percentage', 20.00, 100.00, 50.00, 100, NULL),
    ('PRIMEIRACOMPRA', 'Primeira Compra', 'Desconto de 15% para primeira compra', 'percentage', 15.00, 50.00, 30.00, NULL, NULL),
    ('SKIN50', 'R$ 50 OFF', 'Desconto fixo de R$ 50 em compras acima de R$ 200', 'fixed_amount', 50.00, NULL, 200.00, 50, NULL),
    ('BLACKFRIDAY', 'Black Friday 2024', 'Desconto especial de 30% para Black Friday', 'percentage', 30.00, 150.00, 100.00, 1000, NULL),
    ('NATAL2024', 'Natal 2024', 'Promoção de Natal com 25% de desconto', 'percentage', 25.00, 100.00, 75.00, 500, NULL),
    ('WELCOME', 'Bem-vindo', 'Cupom de boas-vindas com 15% de desconto', 'percentage', 15.00, 75.00, 50.00, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE public.coupons IS 'Tabela para gerenciar cupons de desconto da plataforma';
COMMENT ON TABLE public.coupon_usage IS 'Tabela para rastrear o uso de cupons pelos usuários';

COMMENT ON COLUMN public.coupons.type IS 'Tipo do cupom: percentage (%) ou fixed_amount (valor fixo em R$)';
COMMENT ON COLUMN public.coupons.value IS 'Valor do desconto (% para percentage, R$ para fixed_amount)';
COMMENT ON COLUMN public.coupons.max_discount_amount IS 'Valor máximo de desconto em R$ (apenas para cupons percentage)';
COMMENT ON COLUMN public.coupons.usage_limit IS 'Limite total de uso do cupom (NULL = ilimitado)';
COMMENT ON COLUMN public.coupons.usage_limit_per_user IS 'Quantas vezes cada usuário pode usar o cupom';

-- Função para incrementar uso do cupom
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.coupons 
    SET used_count = used_count + 1 
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 