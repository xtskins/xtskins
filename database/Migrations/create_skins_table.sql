-- ==================================================
-- MIGRAÇÃO: Criar tabela skins completa
-- Data: 2024
-- Descrição: Cria a tabela skins com relação aos usuários,
--           índices, triggers e políticas RLS
-- ==================================================

-- Criar a tabela skins
CREATE TABLE IF NOT EXISTS public.skins (
    -- Identificadores Únicos
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),       -- ID único da skin na nossa base
    user_id UUID NOT NULL,                              -- Referência ao usuário dono da skin
    steamid VARCHAR(50),                                 -- Steam ID do usuário (opcional para inventários)
    assetid VARCHAR(50) NOT NULL UNIQUE,                 -- Asset ID único do Steam
    classid VARCHAR(50) NOT NULL,                        -- Class ID do Steam
    instanceid VARCHAR(50),                              -- Instance ID do Steam
    
    -- Nomes e Slugs
    markethashname VARCHAR(500) NOT NULL,                -- Nome hash do mercado Steam
    marketname VARCHAR(500) NOT NULL,                    -- Nome do mercado Steam
    normalizedname VARCHAR(500),                         -- Nome normalizado
    slug VARCHAR(500),                                   -- Slug para URLs
    
    -- Preços (em BRL)
    price DECIMAL(10,2) DEFAULT 0,                       -- Preço atual em BRL
    discount_price DECIMAL(10,2),                        -- Preço com desconto
    discount INTEGER DEFAULT 0,                          -- Porcentagem de desconto
    
    -- Dados Visuais
    image TEXT NOT NULL,                                 -- URL da imagem da skin
    rarity VARCHAR(100),                                 -- Raridade (Consumer Grade, etc.)
    color VARCHAR(10),                                   -- Cor hex da raridade
    bordercolor VARCHAR(10),                             -- Cor hex da borda
    quality VARCHAR(100),                                -- Qualidade (Souvenir, etc.)
    
    -- Classificações
    type VARCHAR(100),                                   -- Tipo (Rifle, Pistol, etc.)
    sub_type VARCHAR(100),                               -- Sub-tipo (AK-47, M4A4, etc.)
    itemgroup VARCHAR(100),                              -- Grupo do item
    itemname VARCHAR(200),                               -- Nome do item
    itemtype VARCHAR(100),                               -- Tipo específico
    
    -- Estado e Características
    wear VARCHAR(10),                                    -- Condição (FN, MW, FT, WW, BS)
    tradable BOOLEAN DEFAULT true,                       -- Se é trocável
    marketable BOOLEAN DEFAULT true,                     -- Se é vendável no mercado
    
    -- Flags Booleanas
    isstar BOOLEAN DEFAULT false,                        -- Se é StatTrak/Souvenir star
    isstattrak BOOLEAN DEFAULT false,                    -- Se é StatTrak
    issouvenir BOOLEAN DEFAULT false,                    -- Se é Souvenir
    
    -- Acessórios (JSON)
    stickers JSONB DEFAULT '[]',                         -- Array de stickers {name, image}
    charms JSONB DEFAULT '[]',                           -- Array de charms {name, image}
    
    -- Links
    inspectlink TEXT,                                    -- Link de inspeção no jogo
    steamurl TEXT,                                       -- URL do Steam Market
    
    -- Controle Interno
    is_visible BOOLEAN DEFAULT true,                     -- Se está visível na loja
    price_manually_set BOOLEAN DEFAULT false,           -- Se o preço foi definido manualmente
    float_value DECIMAL(8,6),                           -- Valor do float (0.000000-1.000000)
    
    -- Controle de Inventário
    count INTEGER DEFAULT 1,                            -- Quantidade do item
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_skins_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_skins_user_id ON public.skins(user_id);
CREATE INDEX IF NOT EXISTS idx_skins_assetid ON public.skins(assetid);
CREATE INDEX IF NOT EXISTS idx_skins_classid ON public.skins(classid);
CREATE INDEX IF NOT EXISTS idx_skins_rarity ON public.skins(rarity);
CREATE INDEX IF NOT EXISTS idx_skins_type ON public.skins(type);
CREATE INDEX IF NOT EXISTS idx_skins_price ON public.skins(price);
CREATE INDEX IF NOT EXISTS idx_skins_is_visible ON public.skins(is_visible);
CREATE INDEX IF NOT EXISTS idx_skins_created_at ON public.skins(created_at);

-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_skins_updated_at ON public.skins;
CREATE TRIGGER update_skins_updated_at
    BEFORE UPDATE ON public.skins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Users can view own skins" ON public.skins;
CREATE POLICY "Users can view own skins" ON public.skins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skins" ON public.skins;
CREATE POLICY "Users can insert own skins" ON public.skins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skins" ON public.skins;
CREATE POLICY "Users can update own skins" ON public.skins
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skins" ON public.skins;
CREATE POLICY "Users can delete own skins" ON public.skins
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all skins" ON public.skins;
CREATE POLICY "Admins can manage all skins" ON public.skins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Adicionar comentários
COMMENT ON TABLE public.skins IS 'Tabela que armazena as skins de CS2/CS:GO dos usuários';
COMMENT ON COLUMN public.skins.user_id IS 'Referência ao usuário dono da skin';
COMMENT ON COLUMN public.skins.assetid IS 'Asset ID único do Steam para esta skin';
COMMENT ON COLUMN public.skins.price IS 'Preço atual da skin em BRL';
COMMENT ON COLUMN public.skins.float_value IS 'Valor do float da skin (0.000000-1.000000)';
COMMENT ON COLUMN public.skins.stickers IS 'Array JSON com informações dos stickers aplicados';
COMMENT ON COLUMN public.skins.charms IS 'Array JSON com informações dos charms aplicados';

-- Mensagem de sucesso
SELECT 'Tabela skins criada com sucesso!' as message; 