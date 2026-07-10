-- Phase 5, Sprint 5.2 — Badges / achievements.
-- Declarative badge definitions + idempotent per-user awards. Award logic
-- lives in the backend-core evaluateBadges use-case (rule 4 / Option A) — this
-- schema only stores definitions and the awards the evaluator writes.

create type badge_criteria_type as enum (
  'points_total',
  'sponsor_scans',
  'activity_scans',
  'networking_scans',
  'precheckin_approved'
);

create table public.badges (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade, -- null = global
  key           text not null,               -- stable slug
  name          text not null,
  description   text,
  icon          text,                         -- emoji or icon key
  criteria_type badge_criteria_type not null,
  threshold     integer not null default 1,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (event_id, key)
);

create table public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)                  -- idempotent award, one per badge
);

create index user_badges_user_event_idx on public.user_badges(user_id, event_id);
create index badges_event_idx on public.badges(event_id);

alter table public.badges      enable row level security;
alter table public.user_badges enable row level security;

-- Definitions are public-read so attendees can see locked badges + progress.
-- Staff write (admin CRUD is a later stretch goal; seed drives v1).
create policy badges_public_read on public.badges for select using (true);
create policy badges_staff_write on public.badges for all
  using (public.is_staff()) with check (public.is_staff());

-- A user reads their own awards; staff read all. Awards are written by the
-- server-authorized evaluator via the service-role client (like point grants),
-- so there is deliberately NO attendee insert policy.
create policy user_badges_self_read on public.user_badges for select
  using (user_id = auth.uid() or public.is_staff());

-- ─────────────── Seed: BWAI 2026 badge set ───────────────
-- Idempotent via unique(event_id, key). Thresholds tuned to the 15 attached
-- sponsor booths; networking has no natural cap. No activity badge yet —
-- activities aren't configured, so it would be unearnable at launch.
insert into public.badges (event_id, key, name, description, icon, criteria_type, threshold)
select e.id, v.key, v.name, v.description, v.icon,
       v.criteria_type::badge_criteria_type, v.threshold
from public.events e
cross join (values
  ('checkin',          'Confirmado',      'Completaste tu pre-registro.',            '🎫', 'precheckin_approved', 1),
  ('first-connection', 'Primer contacto', 'Conociste a tu primera persona.',         '👋', 'networking_scans',    1),
  ('connector',        'Conector',        'Conociste a 5 personas.',                 '🤝', 'networking_scans',    5),
  ('super-connector',  'Súper Conector',  'Conociste a 12 personas.',                '🌐', 'networking_scans',    12),
  ('explorer',         'Explorador',      'Visitaste 5 stands de patrocinadores.',   '🧭', 'sponsor_scans',       5),
  ('booth-master',     'Maestro de Stands','Visitaste 12 stands.',                   '🏅', 'sponsor_scans',       12),
  ('centurion',        'Centurión',       'Alcanzaste 100 puntos.',                  '💯', 'points_total',        100)
) as v(key, name, description, icon, criteria_type, threshold)
where e.slug = 'bwai-2026'
on conflict (event_id, key) do nothing;
