-- Tabela de Usuários
-- Esta tabela armazena informações básicas dos usuários após autenticação com Google

-- Enum para definir os tipos de usuário/roles
create type user_role as enum ('admin', 'client');

create table public.users (
  id uuid primary key,                                   -- ID único do usuário (vindo do auth.users)
  email text,                                            -- Email do usuário
  name text,                                             -- Nome de exibição
  full_name text,                                        -- Nome completo do usuário
  avatar_url text,                                       -- URL da foto de perfil
  role user_role default 'client',                       -- Role do usuário (client por padrão, admin para administradores)
  level text default 'Bronze',                           -- Nível do usuário (Bronze por padrão)
  steam_id text,                                         -- Steam ID do usuário (usado apenas para admins, pode ser nulo)
  created_at timestamp with time zone default now()      -- Data de criação do registro
); 

