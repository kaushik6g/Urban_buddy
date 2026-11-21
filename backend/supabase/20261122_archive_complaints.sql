begin;

create table if not exists public.deleted_complaints (
  id uuid primary key,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  deleted_at timestamptz not null default now()
);
alter table public.deleted_complaints enable row level security;
revoke all on public.deleted_complaints from public, anon, authenticated;
grant select, insert on public.deleted_complaints to service_role;
create index if not exists deleted_complaints_owner_date
  on public.deleted_complaints (created_by, deleted_at desc);

create or replace function public.archive_complaint(p_id uuid, p_owner uuid)
returns boolean language sql set search_path = '' as $$
  with removed as (
    delete from public.complaints
    where id = p_id and created_by = p_owner returning id, created_by, title
  ), archived as (
    insert into public.deleted_complaints (id, created_by, title)
    select id, created_by, title from removed returning id
  )
  select exists (select 1 from archived);
$$;
revoke execute on function public.archive_complaint(uuid, uuid) from public, anon, authenticated;
grant execute on function public.archive_complaint(uuid, uuid) to service_role;

commit;
