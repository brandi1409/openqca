-- openQCA — Cloud-Datenbankschema (Supabase / Postgres)
-- Anwenden: Supabase-Dashboard → SQL Editor → dieses Skript ausführen.
-- Row-Level-Security stellt sicher, dass jede*r nur die eigenen Daten sieht.

-- ── Profile: Tarif je Nutzer:in ──────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'cloud')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profile: eigene lesen" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Profile: eigene ändern" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Profile: eigene anlegen" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Profil automatisch bei Registrierung anlegen.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Projekte: gespeicherte QCA-Analysen ──────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Projekte: eigene lesen" on public.projects
  for select using (auth.uid() = user_id);

create policy "Projekte: eigene anlegen" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Projekte: eigene ändern" on public.projects
  for update using (auth.uid() = user_id);

create policy "Projekte: eigene löschen" on public.projects
  for delete using (auth.uid() = user_id);

-- updated_at automatisch pflegen.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;

create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

create index if not exists projects_user_id_idx on public.projects(user_id);
