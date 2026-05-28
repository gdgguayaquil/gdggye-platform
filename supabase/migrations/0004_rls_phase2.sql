-- 0004_rls_phase2.sql
-- Row Level Security for the Phase 2 tables. Per CLAUDE.md rule 5
-- (RLS-first) every table introduced in 0002 ships with explicit policies
-- here. The is_staff()/is_admin() helpers read the `system_role` claim
-- injected by 0003_access_token_hook.sql.

-- Enable RLS on every new table
alter table public.users              enable row level security;
alter table public.consent_records    enable row level security;
alter table public.registrations      enable row level security;
alter table public.sponsors           enable row level security;
alter table public.activities         enable row level security;
alter table public.scan_logs          enable row level security;
alter table public.point_transactions enable row level security;

-- Convenience: is the caller an organizer or admin?
create or replace function public.is_staff() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'system_role', 'attendee') in ('organizer','admin');
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'system_role', 'attendee') = 'admin';
$$;

-- USERS
-- Read own row or any when staff; update only own row.
-- Role mutation (system_role) is enforced application-side in use-cases —
-- there is no policy that grants role changes; admins must use a service-role
-- client for that.
create policy users_self_read   on public.users for select
  using (id = auth.uid() or public.is_staff());
create policy users_self_update on public.users for update
  using (id = auth.uid());

-- CONSENT: own rows only (staff don't need to query these from RLS-context).
create policy consent_self on public.consent_records
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- REGISTRATIONS
-- Attendees read their own; staff read all. Self-insert only — point/rank
-- writes happen via service-role inside the route handler.
create policy reg_self_read on public.registrations for select
  using (user_id = auth.uid() or public.is_staff());
create policy reg_self_write on public.registrations for insert
  with check (user_id = auth.uid());

-- SPONSORS / ACTIVITIES
-- Public read when the parent event is visible; staff can write.
create policy sponsors_public_read on public.sponsors for select
  using (
    exists (
      select 1 from public.events e
       where e.id = sponsors.event_id
         and e.status in ('published','live','closed')
    )
  );
create policy sponsors_staff_write on public.sponsors for all
  using (public.is_staff())
  with check (public.is_staff());

create policy activities_public_read on public.activities for select
  using (
    exists (
      select 1 from public.events e
       where e.id = activities.event_id
         and e.status in ('published','live','closed')
    )
  );
create policy activities_staff_write on public.activities for all
  using (public.is_staff())
  with check (public.is_staff());

-- SCAN LOGS
-- Attendees see their own scans; staff see all. Inserts come from the
-- server-only service-role client (route handler), bypassing RLS — there is
-- NO insert policy for attendees on purpose. That's what stops a client
-- from writing fake accepted scans (Rule 4: gamification is server-authorized).
create policy scan_self_read on public.scan_logs for select
  using (scanner_user_id = auth.uid() or public.is_staff());

-- POINT TRANSACTIONS
-- Same shape as scan_logs: attendee read-own, staff read-all, no insert
-- policy. Inserts via service-role only.
create policy pt_self_read on public.point_transactions for select
  using (user_id = auth.uid() or public.is_staff());
