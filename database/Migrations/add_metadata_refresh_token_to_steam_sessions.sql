-- Adicionar colunas metadata e refresh_token à tabela steam_sessions se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna metadata se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'steam_sessions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE steam_sessions ADD COLUMN metadata JSONB;
        COMMENT ON COLUMN steam_sessions.metadata IS 'Dados da sessão Steam (client_id, request_id) armazenados como JSON';
    END IF;

    -- Adicionar coluna refresh_token se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'steam_sessions' 
        AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE steam_sessions ADD COLUMN refresh_token TEXT;
        COMMENT ON COLUMN steam_sessions.refresh_token IS 'Refresh token Steam quando autenticação for concluída';
    END IF;
END $$; 