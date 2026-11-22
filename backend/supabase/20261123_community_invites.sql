create table if not exists public.community_invites (
  community_id uuid not null references public.communities(id) on delete cascade,
  email text not null,
  digest text not null unique,
  expires_at timestamptz not null,
  primary key (community_id, email)
);
alter table public.community_invites enable row level security;
revoke all on public.community_invites from public, anon, authenticated;
grant select, insert, update, delete on public.community_invites to service_role;

create or replace function public.redeem_community_invite(p_digest text, p_name text, p_email text, p_bcrypt_hash text)
returns uuid language plpgsql set search_path = '' as $$
declare
  invitation public.community_invites;
  member uuid;
begin
  if p_bcrypt_hash is null or p_bcrypt_hash !~ '^\$2[aby]\$10\$[./A-Za-z0-9]{53}$' then
    raise exception 'A bcrypt cost-10 password hash is required';
  end if;
  delete from public.community_invites
    where digest = p_digest and email = lower(trim(p_email)) and expires_at > now()
    returning * into invitation;
  if not found then return null; end if;
  insert into public.users(name,email,password,role,community_id)
    values(p_name,invitation.email,p_bcrypt_hash,'user',invitation.community_id)
    returning id into member;
  return member;
end;
$$;
revoke all on function public.redeem_community_invite(text,text,text,text) from public, anon, authenticated;
grant execute on function public.redeem_community_invite(text,text,text,text) to service_role;

create or replace function public.check_invited_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'admin' and exists (select 1 from public.community_invites where email = lower(trim(new.email)) and expires_at > now()) then
    raise exception 'Invited community members must register as citizens';
  end if;
  return new;
end;
$$;
drop trigger if exists check_invited_role on public.users;
create trigger check_invited_role before insert on public.users for each row execute function public.check_invited_role();
