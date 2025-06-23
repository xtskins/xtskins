-- Migration: Adicionar campo welcome_email_sent na tabela users
-- Data: 2024
-- Descrição: Adiciona o campo para rastrear se o email de boas-vindas já foi enviado

-- Adicionar o campo welcome_email_sent
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;

-- Comentário no campo
COMMENT ON COLUMN public.users.welcome_email_sent IS 'Indica se o email de boas-vindas já foi enviado para o usuário'; 