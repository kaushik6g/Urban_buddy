create or replace function public.archive_complaint(p_id uuid, p_owner uuid)
returns boolean language sql set search_path = '' as $$
  with removed as (
    delete from public.complaints where id = p_id and created_by = p_owner
    returning id, created_by, title, status
  ), deducted as (
    update public.users set points = greatest(0, points - 15)
    where id = p_owner and exists (
      select 1 from removed where status in ('Approved', 'In Progress', 'Resolved')
    )
  ), archived as (
    insert into public.deleted_complaints (id, created_by, title)
    select id, created_by, title from removed returning id
  )
  select exists (select 1 from archived);
$$;
