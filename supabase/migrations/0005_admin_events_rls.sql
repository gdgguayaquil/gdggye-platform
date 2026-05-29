-- 0005_admin_events_rls.sql
-- Phase 2 Sprint 3 (admin slice): staff need to insert / update events and
-- event_content. The Phase 1 migration only set up public-read; this adds
-- the missing staff-write policies, matching the pattern from 0004
-- (sponsors_staff_write, activities_staff_write).
--
-- Attendees still see only events with status in (published, live, closed)
-- via the existing events_public_read policy.

create policy events_staff_all on public.events
  for all
  using (public.is_staff())
  with check (public.is_staff());

create policy event_content_staff_all on public.event_content
  for all
  using (public.is_staff())
  with check (public.is_staff());
