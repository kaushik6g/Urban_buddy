-- Isolated test database only. Fixtures are rolled back.
begin;
do $$
declare
  reporter uuid := gen_random_uuid();
  other_user uuid := gen_random_uuid();
  first_report uuid;
  violated text;
begin
  insert into public.users(id,email,name,password) values
    (reporter, reporter::text || '@example.invalid','Duplicate test','unused'),
    (other_user, other_user::text || '@example.invalid','Other reporter','unused');
  insert into public.complaints(title,description,category,latitude,longitude,created_by)
    values ('Broken streetlight','Fixture for duplicate check','Streetlight',12.123451,80,reporter)
    returning id into first_report;
  assert public.has_active_complaint(reporter,'Broken streetlight','Streetlight',12.123451,80);
  assert not public.has_active_complaint(other_user,'Broken streetlight','Streetlight',12.123451,80);
  assert not public.has_active_complaint(reporter,'BROKEN streetlight','Streetlight',12.123451,80);
  assert not public.has_active_complaint(reporter,'Broken  streetlight','Streetlight',12.123451,80);
  assert not public.has_active_complaint(reporter,'Broken streetlight ','Streetlight',12.123451,80);
  assert not public.has_active_complaint(reporter,'Broken streetlight','Streetlight',12.123452,80);
  assert not public.has_active_complaint(reporter,'Broken streetlight','Streetlight',12.123451,80.000001);
  begin
    insert into public.complaints(title,description,category,latitude,longitude,created_by)
      values ('Broken streetlight','Submission from another tab','Streetlight',12.123451,80,reporter);
    raise exception 'Expected duplicate to be rejected';
  exception when unique_violation then
    get stacked diagnostics violated = constraint_name;
    assert violated = 'complaints_one_active_report';
  end;
  insert into public.complaints(title,description,category,latitude,longitude,created_by) values
    ('BROKEN streetlight','Different case','Streetlight',12.123451,80,reporter),
    ('Broken  streetlight','Different whitespace','Streetlight',12.123451,80,reporter),
    ('Broken streetlight','Nearby location','Streetlight',12.123452,80,reporter),
    ('Broken streetlight','Different location','Streetlight',12.124,80,reporter),
    ('Broken streetlight','Different reporter','Streetlight',12.123451,80,other_user);
  update public.complaints set status='Resolved' where id=first_report;
  assert not public.has_active_complaint(reporter,'Broken streetlight','Streetlight',12.123451,80);
  insert into public.complaints(title,description,category,latitude,longitude,created_by)
    values ('Broken streetlight','Problem has recurred','Streetlight',12.123451,80,reporter);
end;
$$;
rollback;
