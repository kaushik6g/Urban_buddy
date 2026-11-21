create or replace function public.switch_community(member_id uuid, target_id uuid, confirmed boolean)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  previous_id uuid;
begin
  select community_id into previous_id from public.users
  where id = member_id and role = 'user' for update;
  if not found then return 'forbidden'; end if;
  if previous_id = target_id then return 'unchanged'; end if;
  if previous_id is not null then
    if confirmed is distinct from true then return 'confirmation_required'; end if;
    delete from public.complaints where created_by = member_id;
  end if;
  update public.users set community_id = target_id where id = member_id;
  return 'updated';
end;
$$;
revoke all on function public.switch_community(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.switch_community(uuid, uuid, boolean) to service_role;
