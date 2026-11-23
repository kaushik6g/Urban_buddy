alter table public.users
  add column if not exists password_reset_digest text,
  add column if not exists password_reset_expires_at timestamptz,
  add column if not exists password_version integer not null default 0;

create unique index if not exists users_password_reset_digest_idx
  on public.users (password_reset_digest) where password_reset_digest is not null;
