-- Políticas de Segurança (RLS) para a tabela users
-- Este arquivo contém todas as políticas de Row Level Security aplicadas à tabela users

-- Habilitar RLS na tabela users
alter table public.users enable row level security;

-- Política: Leitura do próprio perfil
-- Permite que usuários leiam apenas seus próprios dados
create policy "Allow users to read their own profile"
on public.users
for select
using (auth.uid() = id);

-- Política: Atualização do próprio perfil
-- Permite que usuários atualizem apenas seus próprios dados
create policy "Allow users to update their own profile"
on public.users
for update
using (auth.uid() = id); 