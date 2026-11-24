begin;

-- Compact key keeps arbitrarily long titles out of the btree index.
create function public.complaint_title_key(value text)
returns text language sql immutable strict parallel safe as $$
  select pg_catalog.md5(pg_catalog.lower(pg_catalog.btrim(
    pg_catalog.regexp_replace(value, '[[:space:]]+', ' ', 'g')
  )));
$$;

-- If existing rows conflict, the transaction rolls back; no reports are removed.
create unique index complaints_one_active_report
on public.complaints (created_by, category, public.complaint_title_key(title),
  round(latitude::numeric, 5), round(longitude::numeric, 5))
where status in ('Pending', 'Approved', 'In Progress');

create function public.has_active_complaint(p_reporter uuid, p_title text, p_category text,
  p_latitude double precision, p_longitude double precision)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.complaints
    where created_by = p_reporter and category = p_category
      and public.complaint_title_key(title) = public.complaint_title_key(p_title)
      and round(latitude::numeric, 5) = round(p_latitude::numeric, 5)
      and round(longitude::numeric, 5) = round(p_longitude::numeric, 5)
      and status in ('Pending', 'Approved', 'In Progress')
  );
$$;
revoke all on function public.has_active_complaint(uuid,text,text,double precision,double precision)
  from public, anon, authenticated;
grant execute on function public.has_active_complaint(uuid,text,text,double precision,double precision)
  to service_role;

commit;
