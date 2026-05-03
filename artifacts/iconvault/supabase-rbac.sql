-- ============================================================
-- PioDev.studio — RBAC + Tier + Username + Download Quota
-- Jalankan di: Supabase → SQL Editor → New Query → Run
-- Aman untuk dijalankan ulang (idempotent)
-- ============================================================

-- 1. Buat tabel profiles
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  role            text not null default 'user'  check (role in ('user', 'staff', 'admin')),
  tier            text not null default 'free'  check (tier in ('free', 'plus')),
  username        text unique,
  downloads_today int  not null default 0,
  quota_reset_date date,
  created_at      timestamptz not null default now()
);

-- Migrasi: tambah kolom jika tabel sudah ada
alter table public.profiles add column if not exists
  tier text not null default 'free' check (tier in ('free', 'plus'));
alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists downloads_today int not null default 0;
alter table public.profiles add column if not exists quota_reset_date date;

-- 2. Aktifkan Row Level Security
alter table public.profiles enable row level security;

-- 3. Kebijakan RLS untuk profiles

-- User bisa baca profil sendiri
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can view own profile'
  ) then
    create policy "Users can view own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;
end $$;

-- User bisa update profil sendiri (username saja via RLS, bukan role/tier)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- Admin bisa baca semua profil
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Admins can view all profiles'
  ) then
    create policy "Admins can view all profiles"
      on public.profiles for select
      using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- Admin bisa update semua profil (ubah role & tier)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Admins can update profiles'
  ) then
    create policy "Admins can update profiles"
      on public.profiles for update
      using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- 4. Tabel download_logs (riwayat unduhan per user)
create table if not exists public.download_logs (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  icon_id      int         not null,
  downloaded_at timestamptz not null default now()
);

create index if not exists download_logs_user_date
  on public.download_logs (user_id, downloaded_at);

alter table public.download_logs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='download_logs' and policyname='Users can insert own download logs'
  ) then
    create policy "Users can insert own download logs"
      on public.download_logs for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='download_logs' and policyname='Users can view own download logs'
  ) then
    create policy "Users can view own download logs"
      on public.download_logs for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- 5. RPC: check_and_record_download (atomic quota check + log)
-- Dipanggil dari frontend sebelum download; mengembalikan JSON:
--   { allowed: bool, reason?: string, tier: string, quota: int, used: int }
-- quota = -1 berarti tidak terbatas (Plus)
create or replace function public.check_and_record_download(p_icon_id int)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile record;
  v_today   date := current_date;
  v_quota   int  := 50;
begin
  -- Tamu (tidak login): izinkan tapi tidak dicatat
  if v_user_id is null then
    return json_build_object('allowed', true, 'tier', 'guest', 'quota', v_quota, 'used', 0);
  end if;

  select * into v_profile from public.profiles where id = v_user_id;

  -- Plus: tanpa batas
  if v_profile.tier = 'plus' then
    insert into public.download_logs (user_id, icon_id) values (v_user_id, p_icon_id);
    return json_build_object('allowed', true, 'tier', 'plus', 'quota', -1, 'used', -1);
  end if;

  -- Free: reset hitungan jika hari baru
  if v_profile.quota_reset_date is distinct from v_today then
    update public.profiles
    set downloads_today = 0, quota_reset_date = v_today
    where id = v_user_id;
    v_profile.downloads_today := 0;
  end if;

  -- Cek kuota
  if v_profile.downloads_today >= v_quota then
    return json_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'tier', 'free',
      'quota', v_quota,
      'used', v_profile.downloads_today
    );
  end if;

  -- Catat unduhan dan tambah hitungan
  update public.profiles
  set downloads_today = downloads_today + 1
  where id = v_user_id;

  insert into public.download_logs (user_id, icon_id) values (v_user_id, p_icon_id);

  return json_build_object(
    'allowed', true,
    'tier', 'free',
    'quota', v_quota,
    'used', v_profile.downloads_today + 1
  );
end;
$$;

-- 6. Auto-buat profil saat signup (trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, tier)
  values (new.id, new.email, 'user', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. (Opsional) Promosikan diri jadi admin
-- update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';

-- 8. (Opsional) Upgrade akun ke tier Plus
-- update public.profiles set tier = 'plus' where email = 'email-kamu@contoh.com';
