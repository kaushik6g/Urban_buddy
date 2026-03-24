-- UrbanBuddy Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  community_id uuid references public.communities(id) on delete set null,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.users
add column if not exists community_id uuid references public.communities(id) on delete set null;

alter table public.communities
add column if not exists created_by uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'communities_created_by_fkey'
  ) then
    alter table public.communities
    add constraint communities_created_by_fkey
    foreign key (created_by) references public.users(id) on delete set null;
  end if;
end $$;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text default '',
  status text not null default 'Pending' check (
    status in ('Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved')
  ),
  admin_note text default '',
  progress_note text default '',
  created_by uuid not null references public.users(id) on delete cascade,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.complaints
add column if not exists image_urls jsonb not null default '[]'::jsonb;

alter table public.complaints
add column if not exists progress_note text default '';

create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_by on public.complaints(created_by);
create index if not exists idx_complaints_category on public.complaints(category);
create index if not exists idx_users_community_id on public.users(community_id);
create index if not exists idx_communities_code on public.communities(code);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_complaints_updated_at on public.complaints;
create trigger trg_complaints_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

-- Create one admin user manually after running app register or insert directly:
-- update public.users set role = 'admin' where email = 'admin@urbanbuddy.com';
