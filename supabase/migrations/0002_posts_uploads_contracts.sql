-- =============================================================
-- Aurion Clientes — Posts, materiais e armários de arquivos
-- Adiciona: posts (com comentários e fluxo de aprovação),
-- materials (arquivos enviados pelo cliente), e os buckets de
-- Storage para materiais, contratos e mídia de posts, todos com
-- política de segurança (cada um só acessa o que é seu).
-- Cole no SQL Editor e clique em Run.
-- =============================================================

-- -------------------------------------------------------------
-- 1) POSTS — peças de conteúdo no calendário, com fluxo de aprovação
-- -------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  caption       text not null,
  type          text not null default 'image'
                  check (type in ('image','carousel','video','reel','story')),
  status        text not null default 'pending'
                  check (status in ('draft','pending','approved','changes','scheduled','published')),
  scheduled_for date,
  media_url     text,
  comments      jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_client_id_idx on public.posts (client_id);
create index if not exists posts_agency_id_idx on public.posts (agency_id);
create index if not exists posts_scheduled_for_idx on public.posts (scheduled_for);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select
  using (agency_id = public.my_agency_id() or client_id = public.my_client_id());

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert
  with check (
    agency_id = public.my_agency_id()
    and public.my_role() in ('agency_owner','agency_member')
  );

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update
  using (agency_id = public.my_agency_id() or client_id = public.my_client_id())
  with check (agency_id = public.my_agency_id() or client_id = public.my_client_id());

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete
  using (
    agency_id = public.my_agency_id()
    and public.my_role() in ('agency_owner','agency_member')
  );

-- -------------------------------------------------------------
-- 2) MATERIALS — registro dos arquivos enviados (apontam pro Storage)
-- -------------------------------------------------------------
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  name          text not null,
  path          text not null,         -- caminho do arquivo no bucket
  bucket        text not null default 'materials',
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists materials_client_id_idx on public.materials (client_id);
create index if not exists materials_agency_id_idx on public.materials (agency_id);

alter table public.materials enable row level security;

drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials for select
  using (agency_id = public.my_agency_id() or client_id = public.my_client_id());

drop policy if exists materials_insert on public.materials;
create policy materials_insert on public.materials for insert
  with check (agency_id = public.my_agency_id() or client_id = public.my_client_id());

drop policy if exists materials_delete on public.materials;
create policy materials_delete on public.materials for delete
  using (
    agency_id = public.my_agency_id()
    and public.my_role() in ('agency_owner','agency_member')
  );

-- -------------------------------------------------------------
-- 3) STORAGE — armários privados (buckets)
--    materials: fotos/vídeos brutos enviados pelo cliente
--    contracts: contratos PDF/TXT (só agência)
--    posts:     mídia das peças prontas pra publicar
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('materials', 'materials', false),
  ('contracts', 'contracts', false),
  ('posts',     'posts',     false)
on conflict (id) do nothing;

-- Limpa políticas antigas (re-executável)
drop policy if exists "materials_read"  on storage.objects;
drop policy if exists "materials_write" on storage.objects;
drop policy if exists "materials_delete" on storage.objects;
drop policy if exists "contracts_read"  on storage.objects;
drop policy if exists "contracts_write" on storage.objects;
drop policy if exists "contracts_delete" on storage.objects;
drop policy if exists "posts_read"      on storage.objects;
drop policy if exists "posts_write"     on storage.objects;
drop policy if exists "posts_delete"    on storage.objects;

-- Estrutura dos caminhos:
--   materials/{agency_id}/{client_id}/<arquivo>
--   contracts/{agency_id}/{client_id}/<arquivo>
--   posts/{agency_id}/{client_id}/<arquivo>

-- MATERIALS — agência (toda) ou o próprio cliente (sua pasta)
create policy "materials_read" on storage.objects for select
  using (
    bucket_id = 'materials' and (
      (storage.foldername(name))[1] = public.my_agency_id()::text
      or (
        public.my_client_id() is not null
        and (storage.foldername(name))[2] = public.my_client_id()::text
      )
    )
  );

create policy "materials_write" on storage.objects for insert
  with check (
    bucket_id = 'materials' and (
      (storage.foldername(name))[1] = public.my_agency_id()::text
      or (
        public.my_client_id() is not null
        and (storage.foldername(name))[2] = public.my_client_id()::text
      )
    )
  );

create policy "materials_delete" on storage.objects for delete
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
    and public.my_role() in ('agency_owner','agency_member')
  );

-- CONTRACTS — somente agência
create policy "contracts_read" on storage.objects for select
  using (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
  );

create policy "contracts_write" on storage.objects for insert
  with check (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
    and public.my_role() in ('agency_owner','agency_member')
  );

create policy "contracts_delete" on storage.objects for delete
  using (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
    and public.my_role() in ('agency_owner','agency_member')
  );

-- POSTS — agência escreve, cliente também pode ler o que é da sua pasta
create policy "posts_read" on storage.objects for select
  using (
    bucket_id = 'posts' and (
      (storage.foldername(name))[1] = public.my_agency_id()::text
      or (
        public.my_client_id() is not null
        and (storage.foldername(name))[2] = public.my_client_id()::text
      )
    )
  );

create policy "posts_write" on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
    and public.my_role() in ('agency_owner','agency_member')
  );

create policy "posts_delete" on storage.objects for delete
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = public.my_agency_id()::text
    and public.my_role() in ('agency_owner','agency_member')
  );

-- =============================================================
-- Fim. Novas tabelas: posts, materials. Buckets: materials, contracts, posts.
-- =============================================================
