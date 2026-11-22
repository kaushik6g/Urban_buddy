begin;
create or replace function public.review_community_complaint(
  p_admin uuid, p_report uuid, p_expected text, p_status text, p_note text
) returns setof public.complaints language plpgsql security invoker set search_path = '' as $$
declare
  reviewer_community uuid;
begin
  select community_id into reviewer_community from public.users
  where id = p_admin and role = 'admin' for share;
  if reviewer_community is null then return; end if;
  perform 1 from public.users u join public.complaints c on c.created_by = u.id
  where c.id = p_report and u.community_id = reviewer_community for share of u;
  if not found then return; end if;
  return query update public.complaints set
    status = p_status,
    reviewed_at = case when p_expected = 'Pending' then now() else reviewed_at end,
    updated_at = now(),
    admin_note = case when p_status = 'Rejected' then p_note else admin_note end,
    progress_note = case when p_expected <> 'Pending' then p_note else progress_note end
  where id = p_report and status = p_expected returning *;
end; $$;
revoke all on function public.review_community_complaint(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.review_community_complaint(uuid,uuid,text,text,text) to service_role;
commit;