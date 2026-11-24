begin;

drop index if exists public.complaints_one_active_report;
create unique index complaints_one_active_report
on public.complaints (created_by, category, pg_catalog.md5(title), latitude, longitude)
where status in ('Pending', 'Approved', 'In Progress');

create or replace function public.has_active_complaint(p_reporter uuid, p_title text, p_category text,
  p_latitude double precision, p_longitude double precision)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.complaints
    where created_by = p_reporter and category = p_category
      and pg_catalog.md5(title) = pg_catalog.md5(p_title)
      and title collate "C" = p_title
      and latitude = p_latitude and longitude = p_longitude
      and status in ('Pending', 'Approved', 'In Progress')
  );
$$;

revoke all on function public.has_active_complaint(uuid,text,text,double precision,double precision)
  from public, anon, authenticated;
grant execute on function public.has_active_complaint(uuid,text,text,double precision,double precision)
  to service_role;
drop function if exists public.complaint_title_key(text);
commit;
