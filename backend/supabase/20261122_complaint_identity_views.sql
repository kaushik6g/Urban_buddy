begin;

-- created_by identifies the reporter. The archive RPC only permits owner deletion.
-- Keep account details in users and expose the join only to database operators.
create or replace view public.complaints_with_reporter
with (security_invoker = true) as
select c.*, u.name as reporter_name, u.email as reporter_email
from public.complaints c
left join public.users u on u.id = c.created_by;

create or replace view public.deleted_complaints_with_actor
with (security_invoker = true) as
select d.*, u.name as deleted_by_name, u.email as deleted_by_email
from public.deleted_complaints d
left join public.users u on u.id = d.created_by;

revoke all on public.complaints_with_reporter, public.deleted_complaints_with_actor
from public, anon, authenticated, service_role;
grant select on public.complaints_with_reporter, public.deleted_complaints_with_actor to service_role;

commit;
