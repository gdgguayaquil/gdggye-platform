-- 0011_pre_checkin.sql
-- Phase 3: pre-checkin workflow.
--
-- Attendee submits a small form before the event (badge name, photo
-- consent, dietary, t-shirt size, notes). Organizers review the queue
-- and approve/reject. Attendees see the resulting status in the app.
--
-- Design notes:
--   - One row per (event_id, user_id). The attendee can keep editing
--     while still 'pending'; once a staff member sets approved/rejected,
--     the row is locked from attendee edits via the RLS policy.
--   - A NULL `events.pre_checkin_deadline` means "this event doesn't use
--     pre-checkin." Submitting is blocked at the policy level so a
--     compromised client can't bypass it.
--   - submitted_at is fixed at first insert; updated_at moves on every
--     edit (via the shared handle_updated_at trigger from 0001).
--   - Staff has separate ALL policy; multiple permissive policies OR-merge
--     so staff's path is independent of the attendee's deadline guard.

create type pre_checkin_status as enum ('pending', 'approved', 'rejected');

create table public.pre_checkin_submissions (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  status            pre_checkin_status not null default 'pending',

  badge_name        text not null,
  photo_consent     boolean not null,
  dietary           text,
  tshirt_size       text,
  notes             text,

  reviewer_user_id  uuid references public.users(id) on delete set null,
  reviewed_at       timestamptz,
  review_notes      text,

  submitted_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index pre_checkin_event_user_uniq
  on public.pre_checkin_submissions(event_id, user_id);
create index pre_checkin_event_status_idx
  on public.pre_checkin_submissions(event_id, status);

create trigger pre_checkin_submissions_updated_at
  before update on public.pre_checkin_submissions
  for each row execute function public.handle_updated_at();

alter table public.pre_checkin_submissions enable row level security;

-- Read: own row, or any if staff.
create policy pre_checkin_self_read on public.pre_checkin_submissions
  for select using (user_id = auth.uid() or public.is_staff());

-- Insert: own row only, event must be published/live, deadline must be
-- set AND in the future, attendee must be registered to the event. That
-- last check is what makes "pre-checkin for an event you're not attending"
-- impossible without a service-role write.
create policy pre_checkin_self_insert on public.pre_checkin_submissions
  for insert with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.events e
      where e.id = pre_checkin_submissions.event_id
        and e.status in ('published', 'live')
        and e.pre_checkin_deadline is not null
        and e.pre_checkin_deadline > now()
    )
    and exists (
      select 1 from public.registrations r
      where r.event_id = pre_checkin_submissions.event_id
        and r.user_id = auth.uid()
    )
  );

-- Update: own row, still pending, deadline still in the future. WITH
-- CHECK requires the post-edit row to also remain pending — so an
-- attendee can never UPDATE themselves into 'approved'/'rejected'. Staff
-- changes that field via the separate staff_write policy.
create policy pre_checkin_self_update on public.pre_checkin_submissions
  for update using (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.events e
      where e.id = pre_checkin_submissions.event_id
        and e.pre_checkin_deadline is not null
        and e.pre_checkin_deadline > now()
    )
  )
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

-- Staff: read + write all rows for all events.
create policy pre_checkin_staff_write on public.pre_checkin_submissions
  for all using (public.is_staff()) with check (public.is_staff());
