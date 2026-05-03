-- ============================================================
-- PioDev.studio — RBAC + Tier Setup
-- Jalankan di: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Buat tabel profiles
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'user'  check (role in ('user', 'staff', 'admin')),
  tier       text not null default 'free'  check (tier in ('free', 'plus')),
  created_at timestamptz not null default now()
);

-- Tambah kolom tier jika tabel sudah ada (migrasi)
alter table public.profiles add column if not exists
  tier text not null default 'free' check (tier in ('free', 'plus'));

-- 2. Aktifkan Row Level Security
alter table public.profiles enable row level security;

-- 3. Kebijakan RLS

-- User bisa baca profil sendiri
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin bisa baca semua profil
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin bisa update semua profil (ubah role & tier)
create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Auto-buat profil saat signup (trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, tier)
  values (new.id, new.email, 'user', 'free');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. (Opsional) Promosikan diri jadi admin
-- update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';

-- 6. (Opsional) Upgrade akun ke tier Plus
-- update public.profiles set tier = 'plus' where email = 'email-kamu@contoh.com';
