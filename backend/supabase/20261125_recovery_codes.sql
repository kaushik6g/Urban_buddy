begin;

alter table public.users
  add column if not exists backup_code_hashes text[] not null default '{}',
  add column if not exists recovery_community uuid,
  add column if not exists recovery_attempts integer not null default 0;

-- Moving a member cannot transfer their recovery permission to a new admin.
create or replace function public.clear_community_recovery() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.community_id is distinct from old.community_id or new.role is distinct from old.role then
    new.recovery_community := null;
    new.password_reset_digest := null;
    new.password_reset_expires_at := null;
    new.recovery_attempts := 0;
  end if;
  return new;
end;
$$;
drop trigger if exists clear_community_recovery on public.users;
create trigger clear_community_recovery before update of community_id,role on public.users
for each row execute function public.clear_community_recovery();

create or replace function public.issue_member_recovery(p_admin uuid, p_member uuid, p_digest text, p_version integer)
returns boolean language plpgsql set search_path = '' as $$
declare community uuid;
begin
  select community_id into community from public.users
    where id=p_admin and role='admin' and password_version=p_version for share;
  if community is null then return false; end if;
  update public.users set password_reset_digest=p_digest, password_reset_expires_at=now()+interval '10 minutes',
    recovery_attempts=0 where id=p_member and role='user' and community_id=community and recovery_community=community;
  return found;
end;
$$;

create or replace function public.consume_account_code(p_email text, p_digest text, p_temporary boolean, p_password text)
returns boolean language plpgsql set search_path = '' as $$
declare member public.users;
begin
  select * into member from public.users where email=p_email for update;
  if not found then return false; end if;
  if p_temporary then
    if member.role <> 'user' or member.recovery_community is null or member.recovery_community is distinct from member.community_id
      or member.password_reset_digest is null or member.password_reset_expires_at is null
      or member.password_reset_expires_at <= clock_timestamp() or member.recovery_attempts >= 5 then return false; end if;
    if member.password_reset_digest is distinct from p_digest then
      update public.users set recovery_attempts=recovery_attempts+1 where id=member.id;
      return false;
    end if;
  elsif not (p_digest = any(member.backup_code_hashes)) then
    return false;
  end if;
  update public.users set password=p_password,password_version=password_version+1,
    backup_code_hashes=case when p_temporary then '{}'::text[] else array_remove(backup_code_hashes,p_digest) end,
    password_reset_digest=null,password_reset_expires_at=null,recovery_attempts=0 where id=member.id;
  return true;
end;
$$;

revoke all on function public.issue_member_recovery(uuid,uuid,text,integer), public.consume_account_code(text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.issue_member_recovery(uuid,uuid,text,integer), public.consume_account_code(text,text,boolean,text) to service_role;
commit;
