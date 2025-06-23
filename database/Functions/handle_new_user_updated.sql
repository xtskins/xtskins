-- Função: handle_new_user (versão atualizada)
-- Descrição: Esta função é acionada automaticamente quando um novo usuário é criado na tabela auth.users
-- Ela extrai informações do perfil do Google e cria um registro correspondente na tabela public.users
-- Inclui todos os campos necessários para o sistema de email de boas-vindas

create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_meta jsonb;
begin
  user_meta := new.raw_user_meta_data;

  insert into public.users (
    id,
    email,
    name,
    full_name,
    avatar_url,
    role,
    level,
    steam_id,
    welcome_email_sent,
    created_at
  ) values (
    new.id,
    new.email,
    coalesce(user_meta ->> 'name', split_part(new.email, '@', 1), 'Usuário'),
    coalesce(user_meta ->> 'full_name', user_meta ->> 'name', 'Usuário'),
    user_meta ->> 'avatar_url',
    'client',
    'Iniciante',
    null,
    false,
    now()
  );

  return new;
end;
$$ language plpgsql security definer;

-- Remover trigger existente se houver
drop trigger if exists on_auth_user_created on auth.users;

-- Criar trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 