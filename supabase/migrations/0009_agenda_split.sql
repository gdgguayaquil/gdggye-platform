-- 0009_agenda_split.sql
-- Refactor: agenda becomes a relational structure. event_content.agenda
-- JSONB is replaced by:
--   agenda_slots         — one row per session/slot, FK to events.
--   agenda_slot_speakers — slot ↔ speaker join. A slot can have 0 (breaks),
--                          1 (talks), or many speakers (panels).
--
-- Time representation: agenda_slots.start_at is timestamptz. The JSONB
-- format only carried a clock string ("09:00"); we combine it with the
-- event's date and timezone at backfill time so the canonical instant is
-- timezone-safe forever.
--
-- Plan:
--   1. agenda_slots                      (+ RLS, indexes, updated_at)
--   2. agenda_slot_speakers              (+ RLS)
--   3. Backfill slots from event_content.agenda
--   4. Backfill speakers per slot by name lookup
--   5. Drop event_content.agenda

-- ─────────── 1. agenda_slots ────────────────────────────────────────
create table public.agenda_slots (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  start_at          timestamptz not null,
  duration_minutes  integer not null default 0,
  title_es          text not null,
  title_en          text not null,
  track             text,
  room              text not null default '',
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index agenda_slots_event_idx
  on public.agenda_slots(event_id);
create index agenda_slots_event_start_idx
  on public.agenda_slots(event_id, start_at, display_order);

create trigger agenda_slots_updated_at
  before update on public.agenda_slots
  for each row execute function public.handle_updated_at();

alter table public.agenda_slots enable row level security;

-- Read: published+ events for the public; staff always.
create policy agenda_slots_public_read on public.agenda_slots for select
  using (
    exists (
      select 1 from public.events e
      where e.id = agenda_slots.event_id
        and e.status in ('published', 'live', 'closed')
    )
    or public.is_staff()
  );
create policy agenda_slots_staff_write on public.agenda_slots for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────── 2. agenda_slot_speakers ────────────────────────────────
create table public.agenda_slot_speakers (
  id             uuid primary key default gen_random_uuid(),
  slot_id        uuid not null references public.agenda_slots(id) on delete cascade,
  speaker_id     uuid not null references public.speakers(id) on delete restrict,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create unique index agenda_slot_speakers_uniq
  on public.agenda_slot_speakers(slot_id, speaker_id);
create index agenda_slot_speakers_speaker_idx
  on public.agenda_slot_speakers(speaker_id);

alter table public.agenda_slot_speakers enable row level security;

create policy agenda_slot_speakers_public_read on public.agenda_slot_speakers for select
  using (
    exists (
      select 1
        from public.agenda_slots s
        join public.events       e on e.id = s.event_id
       where s.id = agenda_slot_speakers.slot_id
         and e.status in ('published', 'live', 'closed')
    )
    or public.is_staff()
  );
create policy agenda_slot_speakers_staff_write on public.agenda_slot_speakers for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────── 3. Backfill agenda_slots ───────────────────────────────
-- Each JSONB element has: time ("HH:MM"), dur, title_es, title_en, track,
-- room, speaker?. Combine event's local date with the slot's clock time
-- in the event's timezone to land the correct UTC instant.
with src as (
  select
    ec.event_id,
    ev.start_at as event_start,
    ev.timezone as event_tz,
    (item.ordinality - 1)::int as display_order,
    item.value as slot
  from public.event_content ec
  join public.events ev on ev.id = ec.event_id
  cross join lateral
    jsonb_array_elements(coalesce(ec.agenda, '[]'::jsonb))
      with ordinality as item(value, ordinality)
)
insert into public.agenda_slots
  (event_id, start_at, duration_minutes, title_es, title_en, track, room, display_order)
select
  src.event_id,
  ((src.event_start at time zone src.event_tz)::date
     + (src.slot ->> 'time')::time)
    at time zone src.event_tz,
  coalesce((src.slot ->> 'dur')::int, 0),
  coalesce(src.slot ->> 'title_es', ''),
  coalesce(src.slot ->> 'title_en', ''),
  nullif(src.slot ->> 'track', ''),
  coalesce(src.slot ->> 'room', ''),
  src.display_order
from src
where src.slot ->> 'time' is not null
  and src.slot ->> 'title_es' is not null;

-- ─────────── 4. Backfill agenda_slot_speakers ───────────────────────
-- Old format: speaker is a single name string. Lookup the global speaker
-- by case-insensitive name match. Multi-speaker slots (panels) carried no
-- speaker in the JSONB; backfill leaves them empty for staff to fill in.
with src as (
  select
    ec.event_id,
    (item.ordinality - 1)::int as display_order,
    item.value as slot
  from public.event_content ec
  cross join lateral
    jsonb_array_elements(coalesce(ec.agenda, '[]'::jsonb))
      with ordinality as item(value, ordinality)
  where item.value ->> 'speaker' is not null
    and trim(item.value ->> 'speaker') <> ''
)
insert into public.agenda_slot_speakers (slot_id, speaker_id, display_order)
select s.id, sp.id, 0
from src
join public.agenda_slots s
  on s.event_id = src.event_id
 and s.display_order = src.display_order
join public.speakers sp
  on lower(trim(sp.name)) = lower(trim(src.slot ->> 'speaker'))
on conflict (slot_id, speaker_id) do nothing;

-- ─────────── 5. Drop the JSONB column ───────────────────────────────
alter table public.event_content drop column agenda;
