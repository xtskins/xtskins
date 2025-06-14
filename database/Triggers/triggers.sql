-- Trigger: on_auth_user_created
-- Descrição: Aciona a função handle_new_user após a criação de um novo usuário no auth
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user(); 

-- Trigger: prevent_role_update
-- Descrição: Aciona a função prevent_role_change antes de qualquer atualização na tabela users
create trigger prevent_role_update
before update on public.users
for each row
execute function prevent_role_change(); 