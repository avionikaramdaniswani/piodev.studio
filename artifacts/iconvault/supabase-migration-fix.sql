-- ============================================================
-- PioDev.studio — Migration Fix (Jalankan di Supabase SQL Editor)
-- Aman dijalankan berulang kali (idempotent)
-- Langkah: Supabase → SQL Editor → New Query → paste ini → Run
-- ============================================================

-- ── STEP 1: Pastikan tabel profiles ada ─────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  role             text not null default 'user',
  tier             text not null default 'free',
  username         text,
  downloads_today  int  not null default 0,
  quota_reset_date date,
  created_at       timestamptz not null default now()
);

-- ── STEP 2: Tambah kolom yang mungkin belum ada ──────────────
alter table public.profiles add column if not exists email            text;
alter table public.profiles add column if not exists role             text not null default 'user';
alter table public.profiles add column if not exists tier             text not null default 'free';
alter table public.profiles add column if not exists username         text;
alter table public.profiles add column if not exists downloads_today  int  not null default 0;
alter table public.profiles add column if not exists quota_reset_date date;

-- ── STEP 3: Tambah constraint check jika belum ada ──────────
do $$ begin
  begin
    alter table public.profiles add constraint profiles_role_check check (role in ('user', 'staff', 'admin'));
  exception when duplicate_object then null;
  end;
  begin
    alter table public.profiles add constraint profiles_tier_check check (tier in ('free', 'plus'));
  exception when duplicate_object then null;
  end;
  begin
    alter table public.profiles add constraint profiles_username_key unique (username);
  exception when duplicate_object then null;
  end;
end $$;

-- ── STEP 4: Aktifkan RLS ─────────────────────────────────────
alter table public.profiles enable row level security;

-- ── STEP 5: Hapus semua policy lama dan buat ulang (bersih) ──
drop policy if exists "Users can view own profile"    on public.profiles;
drop policy if exists "Users can update own profile"  on public.profiles;
drop policy if exists "Admins can view all profiles"  on public.profiles;
drop policy if exists "Admins can update profiles"    on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── STEP 6: Tabel download_logs ──────────────────────────────
create table if not exists public.download_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  icon_id       int         not null,
  downloaded_at timestamptz not null default now()
);

create index if not exists download_logs_user_date
  on public.download_logs (user_id, downloaded_at);

alter table public.download_logs enable row level security;

drop policy if exists "Users can insert own download logs" on public.download_logs;
drop policy if exists "Users can view own download logs"   on public.download_logs;

create policy "Users can insert own download logs"
  on public.download_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view own download logs"
  on public.download_logs for select
  using (auth.uid() = user_id);

-- ── STEP 7: RPC check_and_record_download ────────────────────
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
  if v_user_id is null then
    return json_build_object('allowed', true, 'tier', 'guest', 'quota', v_quota, 'used', 0);
  end if;

  select * into v_profile from public.profiles where id = v_user_id;

  if v_profile.tier = 'plus' then
    insert into public.download_logs (user_id, icon_id) values (v_user_id, p_icon_id);
    return json_build_object('allowed', true, 'tier', 'plus', 'quota', -1, 'used', -1);
  end if;

  if v_profile.quota_reset_date is distinct from v_today then
    update public.profiles
    set downloads_today = 0, quota_reset_date = v_today
    where id = v_user_id;
    v_profile.downloads_today := 0;
  end if;

  if v_profile.downloads_today >= v_quota then
    return json_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'tier', 'free',
      'quota', v_quota,
      'used', v_profile.downloads_today
    );
  end if;

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

-- ── STEP 8: Trigger auto-buat profil saat signup ─────────────
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

-- ── STEP 9: Set role admin untuk akun kamu ───────────────────
-- Ganti email di bawah dengan email akun kamu, lalu Run
-- update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';

-- ── VERIFIKASI: cek hasilnya ─────────────────────────────────
select id, email, role, tier, username, downloads_today, quota_reset_date
from public.profiles
order by created_at desc
limit 10;
