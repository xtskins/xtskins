-- Políticas RLS para a tabela skins
-- Garantem que usuários só podem ver e modificar suas próprias skins

-- Habilitar RLS na tabela skins
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ver apenas suas próprias skins
CREATE POLICY "Users can view own skins" ON public.skins
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT - usuários podem inserir skins apenas para si mesmos
CREATE POLICY "Users can insert own skins" ON public.skins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - usuários podem atualizar apenas suas próprias skins
CREATE POLICY "Users can update own skins" ON public.skins
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE - usuários podem deletar apenas suas próprias skins
CREATE POLICY "Users can delete own skins" ON public.skins
    FOR DELETE USING (auth.uid() = user_id);

-- Política para admins - admins podem ver e modificar todas as skins
-- (assumindo que existe uma função para verificar se o usuário é admin)
CREATE POLICY "Admins can manage all skins" ON public.skins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    ); 