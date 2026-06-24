-- 0006_sponsors_split.sql
-- Refactor: sponsors become a global identity, with a per-event attachment
-- table carrying tier + booth_label + is_active. Activities still hang off
-- (event_id, sponsor_id) — but sponsor_id now references the global table.
--
-- Migration strategy:
--   1. Rename current `sponsors` → `event_sponsors`. It still owns
--      (event_id, tier, booth_label, is_active) and gains a `sponsor_id` FK.
--   2. Create new global `sponsors` table.
--   3. Backfill `sponsors` from the unique names in event_sponsors. Slug is
--      derived from name (lowercase, alphanumeric + hyphens).
--   4. Wire event_sponsors.sponsor_id to the matching backfilled row.
--   5. Drop the now-redundant columns from event_sponsors (name, logo_url,
--      description) — they live on the global sponsor.
--   6. Switch activities.sponsor_id FK from old sponsors → new sponsors.

-- ─────────── 1. Rename ──────────────────────────────────────────────
alter table public.sponsors rename to event_sponsors;
alter index sponsors_event_idx rename to event_sponsors_event_idx;
alter policy sponsors_public_read on public.event_sponsors
  rename to event_sponsors_public_read;
alter policy sponsors_staff_write on public.event_sponsors
  rename to event_sponsors_staff_write;

-- 1b. Drop activities FK so we can pivot it to the new table later.
alter table public.activities
  drop constraint activities_sponsor_id_fkey;

-- ─────────── 2. Global sponsors ─────────────────────────────────────
create table public.sponsors (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  logo_url     text,
  description  text,
  website_url  text,
  default_tier text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger sponsors_updated_at
  before update on public.sponsors
  for each row execute function public.handle_updated_at();

-- Public read: any signed-in (or anon) caller can list global sponsors.
-- Tightening later is cheap; opening up later means data leak risk.
alter table public.sponsors enable row level security;
create policy sponsors_public_read on public.sponsors for select using (true);
create policy sponsors_staff_write on public.sponsors for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────── 3. Backfill global sponsors ────────────────────────────
-- Unique by lower(trim(name)). Slug: lowercase, non-alphanumerics → "-",
-- collapsed, trimmed.
with distinct_names as (
  select distinct trim(name) as name
    from public.event_sponsors
   where name is not null and trim(name) <> ''
),
slugged as (
  select
    name,
    regexp_replace(
      regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ) as slug
  from distinct_names
)
insert into public.sponsors (slug, name)
select slug, name from slugged
on conflict (slug) do nothing;

-- 3b. Add the new FK column, fill it in, then enforce not-null.
alter table public.event_sponsors
  add column sponsor_id uuid references public.sponsors(id) on delete restrict;

update public.event_sponsors es
   set sponsor_id = s.id
  from public.sponsors s
 where lower(trim(es.name)) = lower(trim(s.name));

-- A row without a matching global sponsor would block the NOT NULL. None
-- should exist after the backfill, but if it does, fail loudly here.
alter table public.event_sponsors
  alter column sponsor_id set not null;

create index event_sponsors_sponsor_idx
  on public.event_sponsors(sponsor_id);

-- One attachment per (event, sponsor). Re-attach with a different tier
-- requires an update, not an insert.
alter table public.event_sponsors
  add constraint event_sponsors_event_sponsor_uniq
  unique (event_id, sponsor_id);

-- ─────────── 4. Drop redundant columns ──────────────────────────────
alter table public.event_sponsors drop column name;
alter table public.event_sponsors drop column logo_url;
alter table public.event_sponsors drop column description;

-- ─────────── 5. Re-point activities ─────────────────────────────────
-- activities.sponsor_id used to reference (the now-renamed) event_sponsors.
-- The data is still valid — we just need to point it at the global sponsor
-- corresponding to that event_sponsor row, then add the new FK.
update public.activities a
   set sponsor_id = es.sponsor_id
  from public.event_sponsors es
 where a.sponsor_id = es.id;

alter table public.activities
  add constraint activities_sponsor_id_fkey
  foreign key (sponsor_id) references public.sponsors(id) on delete restrict;
