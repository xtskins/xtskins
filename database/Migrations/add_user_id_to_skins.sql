-- ==================================================
-- MIGRAÇÃO: Adicionar user_id à tabela skins
-- Data: 2024
-- ==================================================

-- Primeiro, adicionar a coluna user_id (permitindo NULL temporariamente)
ALTER TABLE skins ADD COLUMN IF NOT EXISTS user_id UUID;

-- Se você tiver dados existentes e quiser atribuí-los a um usuário específico:
-- UPDATE skins SET user_id = 'UUID_DO_USUARIO_PADRAO' WHERE user_id IS NULL;

-- Depois de definir os user_ids, tornar a coluna NOT NULL
-- ALTER TABLE skins ALTER COLUMN user_id SET NOT NULL;

-- Adicionar a foreign key constraint
-- ALTER TABLE skins ADD CONSTRAINT fk_skins_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Comentário: Descomente as linhas acima após definir os user_ids para os dados existentes 