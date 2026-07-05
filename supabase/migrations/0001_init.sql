-- Delivery — schéma initial
-- App mono-utilisateur : la source de vérité des notes est Postgres (fini le Google Doc de notes).
-- Modèle repris de docs/PLAN.md §4. Sections de notes = SECTION_KEYS de src/domain/notes.ts.
--
-- RLS : activé partout. L'app côté serveur utilise la clé service-role (bypass RLS) pour le Cron
-- et l'orchestration ; l'utilisateur authentifié (mono-user) accède via des policies auth.uid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- settings : singleton de configuration
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id               boolean primary key default true,          -- singleton (toujours true)
  nom_prenom       text not null default '',
  destinataires    text not null default '',                  -- "To" (liste séparée par virgule)
  cc               text not null default '',
  sujet_fil        text not null default 'Rapport de stage',
  timezone         text not null default 'Indian/Antananarivo',
  llm_provider     text not null default 'gemini' check (llm_provider in ('gemini','groq')),
  drive_folder_id  text,
  gmail_thread_id  text,
  updated_at       timestamptz not null default now(),
  constraint settings_singleton check (id)
);

-- ---------------------------------------------------------------------------
-- projects : contexte et rôle par projet (dev ≠ testeur ≠ designer)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  role         text not null default '',
  description  text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- repos : dépôts GitHub suivis
-- ---------------------------------------------------------------------------
create table if not exists public.repos (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null unique,                            -- "owner/repo"
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- weeks : semaine ISO
-- ---------------------------------------------------------------------------
create table if not exists public.weeks (
  id          uuid primary key default gen_random_uuid(),
  label_fr    text not null,                                   -- libellé FR (getLibelleSemaine)
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'active'
                check (status in ('active','archived')),
  created_at  timestamptz not null default now(),
  unique (start_date, end_date)
);

-- ---------------------------------------------------------------------------
-- notes : notes structurées par section (une ligne par section/semaine)
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  week_id     uuid not null references public.weeks(id) on delete cascade,
  section     text not null
                check (section in (
                  'pointsImportants','tachesRealisees','pointsBlocage',
                  'objectifs','tests','livrables','commits')),
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  unique (week_id, section)
);

-- ---------------------------------------------------------------------------
-- commits : commits GitHub importés (anti-doublon par sha au sein d'une semaine/dépôt)
-- ---------------------------------------------------------------------------
create table if not exists public.commits (
  id            uuid primary key default gen_random_uuid(),
  week_id       uuid not null references public.weeks(id) on delete cascade,
  repo          text not null,
  sha           text not null,
  message       text not null default '',
  committed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (week_id, repo, sha)
);
create index if not exists commits_week_idx on public.commits(week_id);

-- ---------------------------------------------------------------------------
-- reports : rapport généré (long + court) et sortie (Doc, brouillon)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  week_id         uuid not null references public.weeks(id) on delete cascade unique,
  long_json       jsonb,
  short_json      jsonb,
  drive_url       text,
  gmail_draft_id  text,
  status          text not null default 'pending'
                    check (status in ('pending','generated','draft_created','sent')),
  generated_at    timestamptz,
  sent_at         timestamptz
);

-- ---------------------------------------------------------------------------
-- oauth_tokens : jetons Google (mono-utilisateur → un provider par ligne)
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_tokens (
  provider       text primary key default 'google',
  access_token   text not null,
  refresh_token  text,
  expiry         timestamptz,
  scopes         text,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS : activer partout ; policies pour l'utilisateur authentifié.
-- La clé service-role (serveur/Cron) contourne RLS et n'a pas besoin de policy.
-- ---------------------------------------------------------------------------
alter table public.settings     enable row level security;
alter table public.projects     enable row level security;
alter table public.repos        enable row level security;
alter table public.weeks        enable row level security;
alter table public.notes        enable row level security;
alter table public.commits      enable row level security;
alter table public.reports      enable row level security;
alter table public.oauth_tokens enable row level security;

-- Mono-utilisateur : tout utilisateur authentifié a un accès complet.
do $$
declare t text;
begin
  foreach t in array array[
    'settings','projects','repos','weeks','notes','commits','reports','oauth_tokens'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- Singleton settings : insérer la ligne unique.
insert into public.settings (id) values (true) on conflict (id) do nothing;
