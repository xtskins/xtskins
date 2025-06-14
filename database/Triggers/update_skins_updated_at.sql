-- Trigger para atualizar automaticamente o campo updated_at da tabela skins

-- Primeiro, criar a função trigger se ela não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar o trigger para a tabela skins
CREATE TRIGGER update_skins_updated_at
    BEFORE UPDATE ON public.skins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 