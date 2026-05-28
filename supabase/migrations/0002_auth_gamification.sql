-- 0002_auth_gamification.sql
-- Phase 2 schema: users, consent, registrations, sponsors, activities, scans, points.
-- Exact shape from CLAUDE-phase2.md.

-- ── Enums ────────────────────────────────────────────────
create type system_role        as enum ('attendee', 'organizer', 'admin');
create type precheckin_status  as enum ('not_submitted', 'pending', 'approved', 'rejected');
create type scan_target_type   as enum ('sponsor', 'activity', 'attendee');
create type scan_result        as enum ('accepted', 'rejected');
create type point_source       as enum ('sponsor', 'activity', 'networking', 'bonus', 'admin_adjustment');

-- ── Users ────────────────────────────────────────────────
create table public.users (
  id                          uuid primary key references auth.users(id) on delete cascade,
  google_id                   text unique,
  email                       text not null,
  full_name                   text not null default '',
  photo_url                   text,
  company                     text,
  role                        text,                 -- job title, free text
  phone                       text,
  city                        text,
  social_links                jsonb not null default '{}'::jsonb,
  system_role                 system_role not null default 'attendee',
  accepted_terms_at           timestamptz,
  accepted_privacy_at         timestamptz,
  accepted_sponsor_consent_at timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ── Consent records (separate audit trail per consent) ──
create table public.consent_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  consent_type text not null,          -- 'terms' | 'privacy' | 'sponsor'
  version      text not null default 'v1',
  accepted_at  timestamptz not null default now()
);
create index consent_user_idx on public.consent_records(user_id);

-- ── Registrations (one per user per event) ──────────────
create table public.registrations (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.events(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  pre_checkin_status precheckin_status not null default 'not_submitted',
  approved_at        timestamptz,
  total_points       integer not null default 0,
  event_rank         integer,
  created_at         timestamptz not null default now(),
  unique (event_id, user_id)
);
create index reg_event_points_idx on public.registrations(event_id, total_points desc);

-- ── Sponsors ─────────────────────────────────────────────
create table public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  tier        text,
  logo_url    text,
  description text,
  booth_label text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index sponsors_event_idx on public.sponsors(event_id);

-- ── Sponsor activities ──────────────────────────────────
create table public.activities (
  id                  uuid primary key default gen_random_uuid(),
  sponsor_id          uuid not null references public.sponsors(id) on delete cascade,
  event_id            uuid not null references public.events(id) on delete cascade,
  name                text not null,
  points              integer not null default 0,
  starts_at           timestamptz,
  ends_at             timestamptz,
  qr_rotation_seconds integer not null default 0,  -- DORMANT (Model A)
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index activities_event_idx on public.activities(event_id);

-- ── Scan log (every attempt, accepted or rejected) ──────
create table public.scan_logs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  scanner_user_id uuid not null references public.users(id) on delete cascade,
  target_type     scan_target_type not null,
  target_id       uuid not null,
  scanned_at      timestamptz not null default now(),
  points_granted  integer not null default 0,
  result          scan_result not null,
  reject_reason   text
);
-- One-claim-per-target safety net (only accepted scans count).
create unique index scan_one_claim_idx
  on public.scan_logs(event_id, scanner_user_id, target_type, target_id)
  where result = 'accepted';
create index scan_event_idx on public.scan_logs(event_id);

-- ── Point transactions (source of truth for points) ────
create table public.point_transactions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  source_type point_source not null,
  source_id   uuid,
  points      integer not null,
  created_at  timestamptz not null default now()
);
create index pt_event_user_idx on public.point_transactions(event_id, user_id);

-- ── Trigger: keep registrations.total_points in sync ────
-- INFRASTRUCTURE ONLY. It aggregates; it does NOT decide whether to grant.
-- The grant decision lives in backend-core validateAndRecordScan.
create or replace function public.apply_point_transaction()
returns trigger language plpgsql as $$
begin
  update public.registrations
     set total_points = total_points + new.points
   where event_id = new.event_id
     and user_id  = new.user_id;
  return new;
end;
$$;

create trigger point_tx_after_insert
  after insert on public.point_transactions
  for each row execute function public.apply_point_transaction();

-- ── updated_at triggers (reuse handle_updated_at from 0001) ──
create trigger users_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
