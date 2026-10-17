-- =============================================================================
-- IAMD Resources — schéma principal
-- Tables, contraintes, règles d'accès (RLS), stockage des fichiers et recherche.
-- Toutes les opérations d'écriture sont réservées aux administrateurs côté base
-- de données : l'interface ne fait que refléter ces règles.
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'student');

create type public.resource_type as enum (
  'cours',     -- support de cours / chapitre
  'resume',    -- résumé de cours
  'exercice',  -- exercices corrigés
  'tp',        -- travaux pratiques
  'examen',    -- sujet d'examen précédent
  'projet',    -- fichier de projet (rapport, code source…)
  'dataset',   -- jeu de données
  'capture',   -- capture d'écran / illustration
  'lien',      -- ressource externe
  'autre'
);

create type public.project_category as enum (
  'ia', 'machine_learning', 'deep_learning', 'nlp', 'big_data', 'data_science', 'modelisation'
);

create type public.difficulty_level as enum ('debutant', 'intermediaire', 'avance');

create type public.event_kind as enum ('view', 'download');

-- -----------------------------------------------------------------------------
-- Fonctions utilitaires
-- -----------------------------------------------------------------------------

-- unaccent() n'est pas IMMUTABLE ; ce wrapper permet de l'utiliser dans la recherche.
create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, value) $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profils utilisateurs
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 120),
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Vérifie le rôle de l'utilisateur courant. SECURITY DEFINER pour éviter la
-- récursion des règles RLS sur la table profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Création automatique du profil à l'inscription (rôle « student » forcé).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Garde-fou : un changement de rôle n'est possible que pour un administrateur
-- (ou depuis le SQL Editor / la clé service_role), et le dernier administrateur
-- ne peut pas être rétrogradé.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if not (
      public.is_admin()
      or coalesce(auth.role(), '') = 'service_role'
      or current_user in ('postgres', 'supabase_admin')
    ) then
      raise exception 'Modification du rôle non autorisée' using errcode = '42501';
    end if;
    if old.role = 'admin' and new.role <> 'admin'
       and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'Impossible de retirer le dernier administrateur' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- -----------------------------------------------------------------------------
-- Catalogue : formations > niveaux > semestres > matières > chapitres
-- -----------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 200),
  short_name text check (char_length(short_name) <= 40),
  description text check (char_length(description) <= 4000),
  institution text check (char_length(institution) <= 200),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (program_id, name)
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (level_id, name)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels (id) on delete restrict,
  semester_id uuid references public.semesters (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 200),
  short_description text check (char_length(short_description) <= 300),
  presentation text check (char_length(presentation) <= 10000),
  objectives text check (char_length(objectives) <= 10000),
  icon text not null default 'book-open',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Le semestre d'une matière doit appartenir au même niveau.
create or replace function public.check_subject_semester()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.semester_id is not null and not exists (
    select 1 from public.semesters s where s.id = new.semester_id and s.level_id = new.level_id
  ) then
    raise exception 'Le semestre ne correspond pas au niveau choisi' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger subjects_check_semester before insert or update on public.subjects
  for each row execute function public.check_subject_semester();

-- -----------------------------------------------------------------------------
-- Projets
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 200),
  category public.project_category not null,
  subject_id uuid references public.subjects (id) on delete set null,
  summary text check (char_length(summary) <= 300),
  description text check (char_length(description) <= 10000),
  objectives text check (char_length(objectives) <= 5000),
  technologies text[] not null default '{}',
  steps text[] not null default '{}',
  prerequisites text check (char_length(prerequisites) <= 5000),
  difficulty public.difficulty_level not null default 'intermediaire',
  repository_url text check (repository_url ~ '^https?://'),
  demo_url text check (demo_url ~ '^https?://'),
  is_example boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Ressources (documents téléversés ou liens externes)
-- -----------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 200),
  description text check (char_length(description) <= 4000),
  type public.resource_type not null,
  subject_id uuid references public.subjects (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  project_id uuid references public.projects (id) on delete cascade,
  file_path text unique,
  file_name text check (char_length(file_name) <= 255),
  file_size bigint check (file_size > 0),
  mime_type text,
  external_url text check (external_url ~ '^https?://'),
  source text not null check (char_length(source) between 2 and 500),
  author text check (char_length(author) <= 200),
  license text check (char_length(license) <= 200),
  keywords text[] not null default '{}',
  is_published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- soit un fichier, soit un lien externe
  constraint resources_file_or_link check (num_nonnulls(file_path, external_url) = 1),
  constraint resources_file_metadata check (
    file_path is null or (file_name is not null and file_size is not null and mime_type is not null)
  ),
  -- rattachée à une matière et/ou à un projet
  constraint resources_owner check (num_nonnulls(subject_id, project_id) >= 1)
);

create or replace function public.check_resource_chapter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.chapter_id is not null and not exists (
    select 1 from public.chapters c where c.id = new.chapter_id and c.subject_id = new.subject_id
  ) then
    raise exception 'Le chapitre ne correspond pas à la matière choisie' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger resources_check_chapter before insert or update on public.resources
  for each row execute function public.check_resource_chapter();

create index resources_subject_idx on public.resources (subject_id);
create index resources_chapter_idx on public.resources (chapter_id);
create index resources_project_idx on public.resources (project_id);
create index resources_created_idx on public.resources (created_at desc);
create index subjects_level_idx on public.subjects (level_id);
create index chapters_subject_idx on public.chapters (subject_id);
create index projects_subject_idx on public.projects (subject_id);

create trigger programs_updated_at before update on public.programs
  for each row execute function public.set_updated_at();
create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger resources_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Statistiques, favoris
-- -----------------------------------------------------------------------------
create table public.resource_events (
  id bigint generated always as identity primary key,
  resource_id uuid references public.resources (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind public.event_kind not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint resource_events_target check (num_nonnulls(resource_id, project_id) = 1)
);

create index resource_events_resource_idx on public.resource_events (resource_id, kind);
create index resource_events_project_idx on public.resource_events (project_id, kind);
create index resource_events_user_idx on public.resource_events (user_id, created_at desc);
create index resource_events_created_idx on public.resource_events (created_at desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resource_id uuid references public.resources (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_target check (num_nonnulls(resource_id, project_id) = 1),
  unique (user_id, resource_id),
  unique (user_id, project_id)
);

-- -----------------------------------------------------------------------------
-- Visibilité publique
-- -----------------------------------------------------------------------------
create or replace function public.subject_is_visible(p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subjects s
    join public.levels l on l.id = s.level_id
    join public.programs p on p.id = l.program_id
    where s.id = p_subject_id and s.is_published and p.is_published
  );
$$;

create or replace function public.project_is_visible(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.projects where id = p_project_id and is_published);
$$;

create or replace function public.resource_is_visible(p_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id
      and r.is_published
      and (r.subject_id is null or public.subject_is_visible(r.subject_id))
      and (r.project_id is null or public.project_is_visible(r.project_id))
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.levels enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.projects enable row level security;
alter table public.resources enable row level security;
alter table public.resource_events enable row level security;
alter table public.favorites enable row level security;

-- Profils : chacun voit le sien, l'administrateur voit tout.
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Seul le nom est modifiable directement ; le rôle passe par set_user_role().
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- Catalogue : lecture publique des éléments publiés, écriture admin.
create policy "programs_read" on public.programs
  for select using (is_published or (select public.is_admin()));
create policy "programs_admin_write" on public.programs
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "levels_read" on public.levels for select using (true);
create policy "levels_admin_write" on public.levels
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "semesters_read" on public.semesters for select using (true);
create policy "semesters_admin_write" on public.semesters
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "subjects_read" on public.subjects
  for select using (public.subject_is_visible(id) or (select public.is_admin()));
create policy "subjects_admin_write" on public.subjects
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "chapters_read" on public.chapters
  for select using (public.subject_is_visible(subject_id) or (select public.is_admin()));
create policy "chapters_admin_write" on public.chapters
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "projects_read" on public.projects
  for select using (is_published or (select public.is_admin()));
create policy "projects_admin_write" on public.projects
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "resources_read" on public.resources
  for select using (public.resource_is_visible(id) or (select public.is_admin()));
create policy "resources_admin_write" on public.resources
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Événements : insertion uniquement via log_event() ; lecture de son propre
-- historique, ou de tout pour l'administrateur.
create policy "events_read_own_or_admin" on public.resource_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.resource_events from anon, authenticated;

-- Favoris : strictement personnels.
create policy "favorites_own" on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (resource_id is null or public.resource_is_visible(resource_id))
    and (project_id is null or public.project_is_visible(project_id))
  );

-- -----------------------------------------------------------------------------
-- Fonctions RPC
-- -----------------------------------------------------------------------------

-- Enregistre une consultation ou un téléchargement d'un élément visible.
create or replace function public.log_event(
  p_kind public.event_kind,
  p_resource_id uuid default null,
  p_project_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if num_nonnulls(p_resource_id, p_project_id) <> 1 then
    raise exception 'Cible invalide' using errcode = '22023';
  end if;
  if p_resource_id is not null and not (public.resource_is_visible(p_resource_id) or public.is_admin()) then
    return;
  end if;
  if p_project_id is not null and not (public.project_is_visible(p_project_id) or public.is_admin()) then
    return;
  end if;
  insert into public.resource_events (resource_id, project_id, kind, user_id)
  values (p_resource_id, p_project_id, p_kind, auth.uid());
end;
$$;

revoke execute on function public.log_event(public.event_kind, uuid, uuid) from public;
grant execute on function public.log_event(public.event_kind, uuid, uuid) to anon, authenticated;

-- Changement de rôle par un administrateur.
create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée aux administrateurs' using errcode = '42501';
  end if;
  if p_role <> 'admin' and p_user_id = auth.uid()
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Impossible de retirer le dernier administrateur' using errcode = '23514';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'Utilisateur introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- Ressources les plus consultées / téléchargées (agrégats publics uniquement).
create or replace function public.popular_resources(p_limit integer default 6)
returns table (resource_id uuid, views bigint, downloads bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.resource_id,
         count(*) filter (where e.kind = 'view') as views,
         count(*) filter (where e.kind = 'download') as downloads
  from public.resource_events e
  where e.resource_id is not null and public.resource_is_visible(e.resource_id)
  group by e.resource_id
  order by count(*) filter (where e.kind = 'download') * 3 + count(*) filter (where e.kind = 'view') desc,
           e.resource_id
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.popular_resources(integer) to anon, authenticated;

-- Statistiques pour le tableau de bord administrateur.
create or replace function public.admin_overview(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => least(greatest(p_days, 1), 365));
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Action réservée aux administrateurs' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'subjects', (select count(*) from public.subjects),
    'resources_published', (select count(*) from public.resources where is_published),
    'resources_draft', (select count(*) from public.resources where not is_published),
    'projects', (select count(*) from public.projects),
    'users', (select count(*) from public.profiles),
    'views', (select count(*) from public.resource_events where kind = 'view' and created_at >= since),
    'downloads', (select count(*) from public.resource_events where kind = 'download' and created_at >= since),
    'top_resources', coalesce((
      select jsonb_agg(t order by t.downloads desc, t.views desc)
      from (
        select r.id, r.title, r.type,
               count(*) filter (where e.kind = 'view') as views,
               count(*) filter (where e.kind = 'download') as downloads
        from public.resource_events e
        join public.resources r on r.id = e.resource_id
        where e.created_at >= since
        group by r.id, r.title, r.type
        order by downloads desc, views desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select date_trunc('day', created_at)::date as day,
               count(*) filter (where kind = 'view') as views,
               count(*) filter (where kind = 'download') as downloads
        from public.resource_events
        where created_at >= since
        group by 1
      ) d
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_overview(integer) from public, anon;
grant execute on function public.admin_overview(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Recherche plein texte (français, insensible aux accents, préfixes)
-- -----------------------------------------------------------------------------

-- Transforme la saisie utilisateur en tsquery sûre : « apprent auto » → apprent:* & auto:*
create or replace function public.to_prefix_tsquery(p_query text)
returns tsquery
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(trim(p_query), '') = '' then null
    else (
      select to_tsquery('simple', string_agg(quote_literal(token) || ':*', ' & '))
      from (
        select token
        from regexp_split_to_table(lower(public.f_unaccent(p_query)), '[^a-z0-9]+') as token
        where token <> ''
        limit 12
      ) tokens
    )
  end;
$$;

create or replace function public.search_catalog(
  p_query text default null,
  p_kind text default null,            -- 'resource' | 'project' | 'subject'
  p_level_id uuid default null,
  p_subject_id uuid default null,
  p_type public.resource_type default null,
  p_chapter_id uuid default null,
  p_category public.project_category default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  kind text,
  id uuid,
  title text,
  excerpt text,
  slug text,
  subject_name text,
  subject_slug text,
  level_name text,
  resource_type public.resource_type,
  chapter_title text,
  project_category public.project_category,
  is_external boolean,
  created_at timestamptz,
  rank real,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.to_prefix_tsquery(p_query) as tsq),
  items as (
    -- Documents et liens
    select 'resource'::text as kind, r.id, r.title,
           left(coalesce(r.description, ''), 220) as excerpt,
           null::text as slug,
           s.name as subject_name, s.slug as subject_slug, l.name as level_name,
           r.type as resource_type, c.title as chapter_title,
           p.category as project_category,
           (r.external_url is not null) as is_external,
           r.created_at,
           s.level_id, r.subject_id, r.chapter_id,
           setweight(to_tsvector('simple', public.f_unaccent(r.title)), 'A')
             || setweight(to_tsvector('simple', public.f_unaccent(array_to_string(r.keywords, ' '))), 'A')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(s.name, '') || ' ' || coalesce(c.title, '') || ' ' || coalesce(p.title, ''))), 'B')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(r.description, '') || ' ' || coalesce(r.author, '') || ' ' || r.source)), 'C')
             as doc
    from public.resources r
    left join public.subjects s on s.id = r.subject_id
    left join public.levels l on l.id = s.level_id
    left join public.chapters c on c.id = r.chapter_id
    left join public.projects p on p.id = r.project_id
    where public.resource_is_visible(r.id)

    union all

    -- Projets
    select 'project', p.id, p.title,
           left(coalesce(p.summary, p.description, ''), 220),
           p.slug,
           s.name, s.slug, l.name,
           null, null, p.category, false, p.created_at,
           s.level_id, p.subject_id, null::uuid,
           setweight(to_tsvector('simple', public.f_unaccent(p.title)), 'A')
             || setweight(to_tsvector('simple', public.f_unaccent(array_to_string(p.technologies, ' '))), 'A')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(s.name, '') || ' ' || p.category::text)), 'B')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(p.summary, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.objectives, ''))), 'C')
    from public.projects p
    left join public.subjects s on s.id = p.subject_id
    left join public.levels l on l.id = s.level_id
    where p.is_published

    union all

    -- Matières
    select 'subject', s.id, s.name,
           left(coalesce(s.short_description, s.presentation, ''), 220),
           s.slug,
           s.name, s.slug, l.name,
           null, null, null, false, s.created_at,
           s.level_id, s.id, null::uuid,
           setweight(to_tsvector('simple', public.f_unaccent(s.name)), 'A')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(
                  (select string_agg(ch.title, ' ') from public.chapters ch where ch.subject_id = s.id), ''))), 'B')
             || setweight(to_tsvector('simple', public.f_unaccent(coalesce(s.short_description, '') || ' ' || coalesce(s.presentation, '') || ' ' || coalesce(s.objectives, ''))), 'C')
    from public.subjects s
    join public.levels l on l.id = s.level_id
    where public.subject_is_visible(s.id)
  ),
  filtered as (
    select i.*,
           case when q.tsq is null then 0::real else ts_rank(i.doc, q.tsq) end as rank
    from items i, q
    where (q.tsq is null or i.doc @@ q.tsq)
      and (p_kind is null or i.kind = p_kind)
      and (p_level_id is null or i.level_id = p_level_id)
      and (p_subject_id is null or i.subject_id = p_subject_id)
      and (p_type is null or (i.kind = 'resource' and i.resource_type = p_type))
      and (p_chapter_id is null or i.chapter_id = p_chapter_id)
      and (p_category is null or i.project_category = p_category)
  )
  select f.kind, f.id, f.title, f.excerpt, f.slug, f.subject_name, f.subject_slug, f.level_name,
         f.resource_type, f.chapter_title, f.project_category, f.is_external, f.created_at, f.rank,
         count(*) over () as total_count
  from filtered f
  order by f.rank desc, f.created_at desc, f.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_catalog(text, text, uuid, uuid, public.resource_type, uuid, public.project_category, integer, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Stockage des fichiers (bucket privé, accès par URL signée)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50 Mo
  array[
    'application/pdf',
    'application/zip',
    'text/csv',
    'application/x-ipynb+json',
    'application/json',
    'text/plain',
    'text/markdown',
    'text/x-python',
    'text/x-r',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture : fichier rattaché à une ressource visible, ou administrateur.
create policy "documents_read_visible" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.resources r
        where r.file_path = storage.objects.name and public.resource_is_visible(r.id)
      )
    )
  );

create policy "documents_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (select public.is_admin()));

create policy "documents_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()))
  with check (bucket_id = 'documents' and (select public.is_admin()));

create policy "documents_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()));
