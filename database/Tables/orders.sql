-- Tabela de Pedidos
-- Esta tabela armazena informações sobre os pedidos de compra de skins

-- Enum para status dos pedidos
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');

-- Tabela principal de pedidos
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount_percent INTEGER CHECK (coupon_discount_percent >= 0 AND coupon_discount_percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_orders_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    skin_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_order_items_order_id 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_skin_id 
        FOREIGN KEY (skin_id) REFERENCES public.skins(id) ON DELETE RESTRICT
);

-- Índices para melhor performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_skin_id ON public.order_items(skin_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Função para calcular total do pedido
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM public.order_items
    WHERE order_id = order_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total do pedido quando itens são modificados
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
    affected_order_id UUID;
BEGIN
    -- Determinar qual pedido foi afetado
    IF TG_OP = 'DELETE' THEN
        affected_order_id := OLD.order_id;
    ELSE
        affected_order_id := NEW.order_id;
    END IF;
    
    -- Atualizar o total do pedido
    UPDATE public.orders
    SET total_amount = calculate_order_total(affected_order_id),
        updated_at = NOW()
    WHERE id = affected_order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_total_on_items
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_total();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem apenas seus próprios pedidos
CREATE POLICY "Usuários podem ver seus próprios pedidos" ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para usuários criarem seus próprios pedidos
CREATE POLICY "Usuários podem criar seus próprios pedidos" ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios pedidos (apenas status pending)
CREATE POLICY "Usuários podem atualizar pedidos pendentes" ON public.orders
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- Política para admins visualizarem todos os pedidos
CREATE POLICY "Admins podem ver todos os pedidos" ON public.orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Políticas para order_items
CREATE POLICY "Usuários podem ver itens de seus pedidos" ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar itens em seus pedidos" ON public.order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins podem gerenciar todos os itens" ON public.order_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    ); 