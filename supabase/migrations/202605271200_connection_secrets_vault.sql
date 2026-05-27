-- DB 인스턴스 접속 Secret Vault RPC (T-012 / multi-db secrets)

create extension if not exists supabase_vault with schema vault;

/**
 * Vault에 저장된 connection secret JSON을 조회합니다.
 */
create or replace function public.resolve_connection_secret(p_secret_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret text;
begin
  if p_secret_name is null or length(trim(p_secret_name)) = 0 then
    raise exception 'secret name is required';
  end if;

  select decrypted_secret
    into v_secret
    from vault.decrypted_secrets
   where name = trim(p_secret_name)
   limit 1;

  if v_secret is null then
    return null;
  end if;

  return v_secret::jsonb;
exception
  when others then
    begin
      return (select secret::jsonb from vault.decrypted_secrets where name = trim(p_secret_name) limit 1);
    exception
      when others then
        return null;
    end;
end;
$$;

/**
 * connection secret JSON을 Vault에 생성하거나 갱신합니다.
 */
create or replace function public.upsert_connection_secret(
  p_secret_name text,
  p_secret jsonb,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
  v_payload text;
  v_description text;
begin
  if p_secret_name is null or length(trim(p_secret_name)) = 0 then
    raise exception 'secret name is required';
  end if;

  if p_secret is null then
    raise exception 'secret payload is required';
  end if;

  v_payload := p_secret::text;
  v_description := coalesce(p_description, 'DB connection credential');

  select id
    into v_id
    from vault.secrets
   where name = trim(p_secret_name)
   limit 1;

  if v_id is not null then
    perform vault.update_secret(
      v_id,
      v_payload,
      trim(p_secret_name),
      v_description
    );
  else
    perform vault.create_secret(
      v_payload,
      trim(p_secret_name),
      v_description
    );
  end if;
end;
$$;

/**
 * connection secret을 Vault에서 제거합니다.
 */
create or replace function public.delete_connection_secret(p_secret_name text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
begin
  if p_secret_name is null or length(trim(p_secret_name)) = 0 then
    return false;
  end if;

  select id
    into v_id
    from vault.secrets
   where name = trim(p_secret_name)
   limit 1;

  if v_id is null then
    return false;
  end if;

  delete from vault.secrets where id = v_id;
  return true;
end;
$$;

revoke all on function public.resolve_connection_secret(text) from public;
revoke all on function public.upsert_connection_secret(text, jsonb, text) from public;
revoke all on function public.delete_connection_secret(text) from public;

grant execute on function public.resolve_connection_secret(text) to service_role;
grant execute on function public.upsert_connection_secret(text, jsonb, text) to service_role;
grant execute on function public.delete_connection_secret(text) to service_role;
