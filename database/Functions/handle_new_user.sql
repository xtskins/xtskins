-- Função: handle_new_user
-- Descrição: Esta função é acionada automaticamente quando um novo usuário é criado na tabela auth.users
-- Ela extrai informações do perfil do Google e cria um registro correspondente na tabela public.users

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
    avatar_url
  ) values (
    new.id,
    new.email,
    user_meta ->> 'name',
    user_meta ->> 'full_name',
    user_meta ->> 'avatar_url'
  );

  return new;
end;
$$ language plpgsql security definer; 