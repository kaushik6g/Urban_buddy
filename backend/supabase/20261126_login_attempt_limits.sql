begin;

create table public.login_attempt_limits (
  account_key text primary key,
  attempts smallint not null,
  last_ticket uuid not null,
  blocked_until timestamptz not null,
  expires_at timestamptz not null
);
create index login_attempt_limits_expiry on public.login_attempt_limits(expires_at);
alter table public.login_attempt_limits enable row level security;
revoke all on public.login_attempt_limits from public, anon, authenticated;
grant select, insert, update, delete on public.login_attempt_limits to service_role;

create function public.reserve_login_attempt(p_account text, p_ticket uuid)
returns table(wait_seconds integer, failure_delay integer)
language plpgsql security invoker set search_path = '' as $$
declare
  previous public.login_attempt_limits;
  moment timestamptz;
  count_now integer;
  delay_now integer;
begin
  insert into public.login_attempt_limits values(p_account,0,p_ticket,now(),now() + interval '15 minutes')
    on conflict (account_key) do update set account_key=excluded.account_key
    returning * into previous;
  moment := clock_timestamp();
  if previous.blocked_until > moment then
    return query select ceil(extract(epoch from previous.blocked_until - moment))::integer, 0;
    return;
  end if;
  count_now := case when previous.expires_at <= moment then 1 else least(previous.attempts + 1, 9) end;
  delay_now := case when count_now < 5 then 0 else least(300, 30 * (1 << (count_now - 5))) end;
  update public.login_attempt_limits set attempts=count_now, last_ticket=p_ticket,
    blocked_until=moment + make_interval(secs => delay_now),
    expires_at=moment + interval '15 minutes' where account_key=p_account;
  -- Expired counters for inactive addresses are reclaimed in bounded batches.
  delete from public.login_attempt_limits where account_key in (
    select l.account_key from public.login_attempt_limits l
    where l.expires_at <= clock_timestamp() order by l.expires_at limit 32 for update skip locked
  );
  return query select 0, delay_now;
end;
$$;
revoke all on function public.reserve_login_attempt(text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_login_attempt(text,uuid) to service_role;
commit;
