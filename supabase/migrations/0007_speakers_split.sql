-- 0007_speakers_split.sql
-- Refactor: speakers become a first-class relational entity (mirrors the
-- sponsor split in 0006). Per-event attachment via event_speakers carries
-- display order, optional track, headliner flag, and active toggle.
--
-- This migration also drops the now-dead `event_content.sponsors` JSONB
-- column — sponsors live in event_sponsors + sponsors (since 0006), and
-- the marketing read path is being moved to hydrate from those joins.
--
-- Plan:
--   1. Create global `speakers` table + RLS.
--   2. Create `event_speakers` attachment + RLS.
--   3. Backfill speakers + attachments from `event_content.speakers` JSONB.
--   4. Drop `event_content.speakers` and `event_content.sponsors` columns.
--   5. Create `speakers` Supabase Storage bucket (public read, staff write).

-- ─────────── 1. Global speakers ─────────────────────────────────────
create table public.speakers (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  role_es       text,
  role_en       text,
  city          text,
  bio_es        text,
  bio_en        text,
  photo_url     text,
  website_url   text,
  github_url    text,
  x_url         text,
  linkedin_url  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger speakers_updated_at
  before update on public.speakers
  for each row execute function public.handle_updated_at();

alter table public.speakers enable row level security;
create policy speakers_public_read on public.speakers for select using (true);
create policy speakers_staff_write on public.speakers for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────── 2. event_speakers attachment ───────────────────────────
create table public.event_speakers (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  speaker_id     uuid not null references public.speakers(id) on delete restrict,
  display_order  integer not null default 0,
  track          text,
  is_headliner   boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create unique index event_speakers_event_speaker_uniq
  on public.event_speakers(event_id, speaker_id);
create index event_speakers_event_idx on public.event_speakers(event_id);
create index event_speakers_speaker_idx on public.event_speakers(speaker_id);

alter table public.event_speakers enable row level security;
create policy event_speakers_public_read on public.event_speakers for select
  using (
    -- Marketing site reads attachments for published+ events only.
    exists (
      select 1 from public.events e
      where e.id = event_speakers.event_id
        and e.status in ('published', 'live', 'closed')
    )
    or public.is_staff()
  );
create policy event_speakers_staff_write on public.event_speakers for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────── 3. Backfill from event_content.speakers JSONB ──────────
-- Each speakers entry is { name, role_es, role_en, city }. Unique by
-- lower(trim(name)). Slug derived the same way as sponsors.
with all_speakers as (
  select distinct
    sp ->> 'name'                          as name,
    coalesce(sp ->> 'role_es', '')         as role_es,
    coalesce(sp ->> 'role_en', '')         as role_en,
    coalesce(sp ->> 'city', '')            as city
  from public.event_content ec,
       jsonb_array_elements(coalesce(ec.speakers, '[]'::jsonb)) as sp
  where sp ->> 'name' is not null
    and trim(sp ->> 'name') <> ''
),
slugged as (
  select
    regexp_replace(
      regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ) as slug,
    name,
    nullif(role_es, '') as role_es,
    nullif(role_en, '') as role_en,
    nullif(city, '')    as city
  from all_speakers
)
insert into public.speakers (slug, name, role_es, role_en, city)
select slug, name, role_es, role_en, city
from slugged
on conflict (slug) do nothing;

-- Attach speakers to their source events, preserving JSONB array order.
with src as (
  select
    ec.event_id,
    sp.value ->> 'name' as name,
    (sp.ordinality - 1) as display_order
  from public.event_content ec,
       jsonb_array_elements(coalesce(ec.speakers, '[]'::jsonb))
         with ordinality as sp(value, ordinality)
  where sp.value ->> 'name' is not null
    and trim(sp.value ->> 'name') <> ''
)
insert into public.event_speakers (event_id, speaker_id, display_order)
select src.event_id, s.id, src.display_order
from src
join public.speakers s
  on lower(trim(s.name)) = lower(trim(src.name))
on conflict (event_id, speaker_id) do nothing;

-- ─────────── 4. Drop dead JSONB columns ─────────────────────────────
-- event_content.speakers is replaced by event_speakers join.
-- event_content.sponsors was already dead since 0006 — marketing site is
-- moving to read from event_sponsors join in the same release.
alter table public.event_content drop column speakers;
alter table public.event_content drop column sponsors;

-- ─────────── 5. Storage bucket for speaker photos ───────────────────
-- Public read so the marketing site can <Image src=…> without minting a
-- signed URL per render. Writes are staff-only (admin uploads via the
-- service-role client, RLS is the safety net not the gate).
insert into storage.buckets (id, name, public)
values ('speakers', 'speakers', true)
on conflict (id) do nothing;

-- storage.objects RLS is enabled by default in Supabase. We add bucket-
-- scoped policies; other buckets are unaffected.
create policy "speakers_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'speakers');

create policy "speakers_bucket_staff_insert"
  on storage.objects for insert
  with check (bucket_id = 'speakers' and public.is_staff());

create policy "speakers_bucket_staff_update"
  on storage.objects for update
  using (bucket_id = 'speakers' and public.is_staff())
  with check (bucket_id = 'speakers' and public.is_staff());

create policy "speakers_bucket_staff_delete"
  on storage.objects for delete
  using (bucket_id = 'speakers' and public.is_staff());
