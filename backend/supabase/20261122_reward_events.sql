begin;
lock table public.complaints in share row exclusive mode;
alter table public.complaints add column if not exists earned_points integer not null default 0;
create table if not exists public.complaint_updates (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  complaint_id uuid not null, title text not null, status text not null,
  note text, points_change integer not null, created_at timestamptz not null default now()
);
alter table public.complaint_updates enable row level security;
revoke all on public.complaint_updates from public, anon, authenticated;
grant select, insert on public.complaint_updates to service_role;
create index if not exists complaint_updates_user_time on public.complaint_updates(user_id, created_at desc);
with seeded as (
  update public.complaints set earned_points = case when status='Resolved' then 50 else 15 end
  where earned_points=0 and status in ('Approved','In Progress','Resolved')
  returning created_by,id,title,status,earned_points,progress_note
), history as (
  insert into public.complaint_updates(user_id,complaint_id,title,status,note,points_change)
  select created_by,id,title,status,progress_note,earned_points from seeded
)
update public.users u set points=u.points+b.bonus from
(select created_by,sum(earned_points-15) bonus from seeded group by created_by) b where u.id=b.created_by;

create or replace function public.record_complaint_update() returns trigger language plpgsql set search_path='' as $$
declare delta integer;
begin
  if old.status=new.status and old.progress_note is not distinct from new.progress_note then return new; end if;
  new.earned_points := greatest(old.earned_points, case when new.status='Resolved' then 50 when new.status in ('Approved','In Progress') then 15 else 0 end);
  delta := new.earned_points-old.earned_points;
  if delta<>0 then update public.users set points=points+delta where id=new.created_by; end if;
  insert into public.complaint_updates(user_id,complaint_id,title,status,note,points_change)
  values(new.created_by,new.id,new.title,new.status,case when new.status='Rejected' then new.admin_note else new.progress_note end,delta);
  return new;
end; $$;
drop trigger if exists complaint_reward_update on public.complaints;
create trigger complaint_reward_update before update of status,progress_note on public.complaints for each row execute function public.record_complaint_update();
create or replace function public.archive_complaint(p_id uuid,p_owner uuid) returns boolean language plpgsql set search_path='' as $$
declare report public.complaints%rowtype;
begin
  delete from public.complaints where id=p_id and created_by=p_owner returning * into report;
  if not found then return false; end if;
  update public.users set points=greatest(0,points-report.earned_points) where id=p_owner;
  insert into public.deleted_complaints(id,created_by,title) values(report.id,p_owner,report.title);
  insert into public.complaint_updates(user_id,complaint_id,title,status,points_change) values(p_owner,report.id,report.title,'Deleted',-report.earned_points);
  return true;
end; $$;
commit;
