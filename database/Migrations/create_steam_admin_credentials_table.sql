-- Tabela para armazenar apenas refresh tokens Steam do admin
CREATE TABLE IF NOT EXISTS steam_admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas um refresh token
  UNIQUE(user_id)
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_steam_admin_credentials_user_id ON steam_admin_credentials(user_id);

-- RLS (Row Level Security) - apenas o próprio usuário pode acessar seus tokens
ALTER TABLE steam_admin_credentials ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o usuário veja apenas seus próprios tokens
CREATE POLICY "Users can view own steam tokens" ON steam_admin_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que o usuário atualize apenas seus próprios tokens
CREATE POLICY "Users can update own steam tokens" ON steam_admin_credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que o usuário insira seus próprios tokens
CREATE POLICY "Users can insert own steam tokens" ON steam_admin_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que o usuário delete seus próprios tokens
CREATE POLICY "Users can delete own steam tokens" ON steam_admin_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários na tabela e colunas
COMMENT ON TABLE steam_admin_credentials IS 'Armazena apenas refresh tokens Steam para admins automatizarem o processo de obtenção do steam_login_secure';
COMMENT ON COLUMN steam_admin_credentials.user_id IS 'ID do usuário que possui o refresh token';
COMMENT ON COLUMN steam_admin_credentials.refresh_token IS 'Refresh token do Steam para renovação automática de cookies'; 