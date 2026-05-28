-- 0001_events_and_content.sql
-- Phase 1 schema for GDG Guayaquil platform.
-- Creates the `events` and `event_content` tables, enums, indexes, RLS policies,
-- and an updated_at trigger. Public-read access is allowed for events whose
-- status is one of ('published', 'live', 'closed').

-- ─────────────── Enums ───────────────
-- Flagship types ('devfest', 'build_with_ai', 'google_io') get their own
-- branding and color accents. Generic types ('meetup', 'tech_talk',
-- 'conference', 'workshop', 'hackathon') cover the regular community
-- calendar — monthly meetups, one-off talks, etc.
create type event_type    as enum (
  'devfest',
  'build_with_ai',
  'google_io',
  'meetup',
  'tech_talk',
  'conference',
  'workshop',
  'hackathon'
);
create type event_status  as enum ('draft', 'published', 'live', 'closed');
create type language_mode as enum ('es', 'en', 'bilingual');

-- ─────────────── events ───────────────
create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  type                  event_type not null,
  year                  integer not null,
  status                event_status not null default 'draft',
  language_mode         language_mode not null default 'bilingual',
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  timezone              text not null default 'America/Guayaquil',
  venue_name            text,
  venue_address         text,
  venue_map_url         text,
  ticket_url            text,
  pre_checkin_deadline  timestamptz,
  leaderboard_enabled   boolean not null default true,
  theme_key             text not null default 'gdggye-core',
  summary_es            text,
  summary_en            text,
  expected_attendance   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index events_status_idx on public.events(status);
create index events_year_idx   on public.events(year);

-- ─────────────── event_content ───────────────
create table public.event_content (
  event_id    uuid primary key references public.events(id) on delete cascade,
  hero        jsonb not null default '{}'::jsonb,
  agenda      jsonb not null default '[]'::jsonb,
  speakers    jsonb not null default '[]'::jsonb,
  sponsors    jsonb not null default '[]'::jsonb,
  gallery     jsonb not null default '[]'::jsonb,
  faq         jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ─────────────── RLS ───────────────
alter table public.events        enable row level security;
alter table public.event_content enable row level security;

create policy "events_public_read" on public.events
  for select using (status in ('published', 'live', 'closed'));

create policy "event_content_public_read" on public.event_content
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_content.event_id
        and e.status in ('published', 'live', 'closed')
    )
  );

-- ─────────────── updated_at trigger ───────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

create trigger event_content_updated_at
  before update on public.event_content
  for each row execute function public.handle_updated_at();
