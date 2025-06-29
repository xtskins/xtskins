-- Tabela para gerenciar sessões Steam ativas com sistema de lock
CREATE TABLE IF NOT EXISTS steam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL, -- Identificador único da instância do servidor
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, expired
  qr_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_steam_sessions_session_id ON steam_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_steam_sessions_user_id ON steam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_sessions_instance_id ON steam_sessions(instance_id);
CREATE INDEX IF NOT EXISTS idx_steam_sessions_status ON steam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_steam_sessions_expires_at ON steam_sessions(expires_at);

-- RLS (Row Level Security)
ALTER TABLE steam_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o usuário gerencie apenas suas próprias sessões
CREATE POLICY "Users can manage own steam sessions" ON steam_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Função para limpar sessões expiradas automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_steam_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM steam_sessions 
  WHERE expires_at < NOW() 
    AND status NOT IN ('completed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE steam_sessions IS 'Gerencia sessões Steam ativas com sistema de lock para produção';
COMMENT ON COLUMN steam_sessions.session_id IS 'ID único da sessão Steam';
COMMENT ON COLUMN steam_sessions.instance_id IS 'ID da instância do servidor que gerencia esta sessão';
COMMENT ON COLUMN steam_sessions.status IS 'Status da sessão: pending, completed, failed, expired'; 