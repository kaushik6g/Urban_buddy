-- Run after the migration in an isolated test database. Fixture data is rolled back.
begin;
do $$
declare
  key_a text := gen_random_uuid()::text;
  key_b text := gen_random_uuid()::text;
  ticket uuid := gen_random_uuid();
  outcome record;
  n integer;
begin
  for n in 1..9 loop
    select * into outcome from public.reserve_login_attempt(key_a,ticket);
    assert outcome.wait_seconds=0;
    assert outcome.failure_delay=(array[0,0,0,0,30,60,120,240,300])[n];
    if n>=5 then
      select * into outcome from public.reserve_login_attempt(key_a,gen_random_uuid());
      assert outcome.wait_seconds between 1 and 300;
      assert (select attempts=n and last_ticket=ticket from public.login_attempt_limits where account_key=key_a);
      update public.login_attempt_limits set blocked_until=now()-interval '1 second' where account_key=key_a;
    end if;
  end loop;
  select * into outcome from public.reserve_login_attempt(key_b,gen_random_uuid());
  assert outcome.wait_seconds=0 and outcome.failure_delay=0;
  update public.login_attempt_limits set expires_at=now()-interval '1 second' where account_key=key_a;
  select * into outcome from public.reserve_login_attempt(key_a,ticket);
  assert outcome.wait_seconds=0 and outcome.failure_delay=0;
  assert (select attempts=1 from public.login_attempt_limits where account_key=key_a);
end;
$$;
rollback;
