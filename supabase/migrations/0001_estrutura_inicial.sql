-- =============================================================
-- Aurion Clientes — Estrutura inicial do banco
-- Tabelas: agencies (a conta/social media), profiles (usuários e
-- papéis) e clients (clientes, com cobrança e contrato).
-- Inclui RLS (cada um só enxerga o que é seu) e gatilhos.
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 1) AGÊNCIA (a "conta" da social media)
-- -------------------------------------------------------------
create table if not exists public.agencies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique,
  logo_url      text,
  primary_color text default '#c19a3f',
  owner_id      uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2) CLIENTES (incluindo cobrança e contrato)
-- -------------------------------------------------------------
create table if not exists public.clients (
  id                    uuid primary key default gen_random_uuid(),
  agency_id             uuid not null references public.agencies (id) on delete cascade,
  name                  text not null,
  handle                text,                 -- @ do Instagram
  instagram_followers   integer default 0,
  color                 text default '#3a5bbf',
  contact_name          text,
  contact_email         text,
  contact_phone         text,
  status                text not null default 'active'
                          check (status in ('active','paused','archived')),
  -- cobrança / contrato
  monthly_value         numeric(10,2),
  due_day               integer check (due_day between 1 and 31),
  payment_status        text not null default 'pending'
                          check (payment_status in ('paid','pending','overdue')),
  contract_url          text,
  contract_file_name    text,
  contract_due_detected boolean not null default false,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists clients_agency_id_idx on public.clients (agency_id);

-- -------------------------------------------------------------
-- 3) PERFIS (liga cada usuário do login a um papel)
--    role: agency_owner | agency_member | client
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  role       text not null default 'agency_owner'
               check (role in ('agency_owner','agency_member','client')),
  agency_id  uuid references public.agencies (id) on delete cascade,
  client_id  uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_agency_id_idx on public.profiles (agency_id);
create index if not exists profiles_client_id_idx on public.profiles (client_id);

-- -------------------------------------------------------------
-- 4) Gatilho: atualiza updated_at automaticamente
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agencies_set_updated_at on public.agencies;
create trigger agencies_set_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 5) Gatilho: cria um perfil automaticamente quando alguém
--    se cadastra no login (auth.users)
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'agency_owner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- 6) Funções auxiliares (security definer) — leem o papel/agência
--    do usuário logado sem causar recursão de RLS
-- -------------------------------------------------------------
create or replace function public.my_agency_id()
returns uuid language sql stable security definer set search_path = public as $$
  select agency_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- -------------------------------------------------------------
-- 7) RLS — segurança por linha (cada um só vê o que é seu)
-- -------------------------------------------------------------
alter table public.agencies enable row level security;
alter table public.clients  enable row level security;
alter table public.profiles enable row level security;

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or (agency_id is not null and agency_id = public.my_agency_id()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- AGENCIES
drop policy if exists agencies_select on public.agencies;
create policy agencies_select on public.agencies for select
  using (id = public.my_agency_id() or owner_id = auth.uid());

drop policy if exists agencies_insert on public.agencies;
create policy agencies_insert on public.agencies for insert
  with check (owner_id = auth.uid());

drop policy if exists agencies_update on public.agencies;
create policy agencies_update on public.agencies for update
  using (id = public.my_agency_id() and public.my_role() in ('agency_owner','agency_member'))
  with check (id = public.my_agency_id());

-- CLIENTS
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select
  using (agency_id = public.my_agency_id() or id = public.my_client_id());

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert
  with check (agency_id = public.my_agency_id() and public.my_role() in ('agency_owner','agency_member'));

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update
  using (agency_id = public.my_agency_id() and public.my_role() in ('agency_owner','agency_member'))
  with check (agency_id = public.my_agency_id());

drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete
  using (agency_id = public.my_agency_id() and public.my_role() = 'agency_owner');

-- =============================================================
-- Fim. Tabelas criadas: agencies, clients, profiles.
-- =============================================================
