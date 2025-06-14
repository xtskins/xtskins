-- Função: prevent_role_change
-- Descrição: Esta função impede que usuários comuns alterem sua própria role
-- Apenas requisições com service_role podem modificar o campo 'role'

create or replace function prevent_role_change()
returns trigger as $$
begin
  -- Só bloqueia se a 'role' for alterada
  if (new.role <> old.role) then
    -- Checa se NÃO é 'service_role'
    if current_setting('request.jwt.claims', true)::jsonb ->> 'role' != 'service_role' then
      raise exception 'Você não tem permissão para alterar a role do usuário.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer; 