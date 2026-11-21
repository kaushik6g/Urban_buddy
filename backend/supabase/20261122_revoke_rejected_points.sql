begin;
create or replace function public.record_complaint_update() returns trigger language plpgsql set search_path='' as $$
declare delta integer;
begin
  if old.status=new.status and old.progress_note is not distinct from new.progress_note
    and (new.status <> 'Rejected' or old.earned_points = 0) then return new; end if;
  new.earned_points := case when new.status = 'Rejected' then 0 else greatest(old.earned_points, case when new.status='Resolved' then 50 when new.status in ('Approved','In Progress') then 15 else 0 end) end;
  delta := new.earned_points-old.earned_points;
  if delta<>0 then update public.users set points=greatest(0, points+delta) where id=new.created_by; end if;
  insert into public.complaint_updates(user_id,complaint_id,title,status,note,points_change)
  values(new.created_by,new.id,new.title,new.status,case when new.status='Rejected' then new.admin_note else new.progress_note end,delta);
  return new;
end; $$;

update public.complaints set status = 'Rejected'
where status = 'Rejected' and earned_points > 0;
commit;
