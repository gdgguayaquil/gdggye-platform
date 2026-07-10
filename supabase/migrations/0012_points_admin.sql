-- Phase 4, Sprint 4.2 — Points administration.
-- Adds the audit note for manual point adjustments and lets staff post
-- admin_adjustment transactions under RLS (no service-role key needed).

-- 1. Audit fields for manual adjustments. Both nullable because scan-driven
--    transactions (sponsor/activity) never set them: `note` is the operator's
--    reason, `actor_user_id` is which staff member posted it.
alter table public.point_transactions
  add column note text,
  add column actor_user_id uuid references public.users(id) on delete set null;

-- 2. Staff may INSERT admin_adjustment rows — and only those. Attendees have
--    no insert policy at all (unchanged), so they still cannot mint points.
--    Scan-driven inserts continue to run through the service-role client,
--    which bypasses RLS regardless of this policy.
create policy pt_staff_adjust on public.point_transactions
  for insert
  with check (public.is_staff() and source_type = 'admin_adjustment');

-- 3. The aggregation trigger owns registrations.total_points. Until now every
--    point_transactions insert came from the service-role client, so the
--    trigger's UPDATE ran with RLS bypassed. A staff-JWT insert (step 2) runs
--    with RLS ON, and there is no staff UPDATE policy on registrations (by
--    design — nothing may write total_points directly). Make the trigger
--    SECURITY DEFINER so its UPDATE always runs as the function owner and
--    bypasses RLS, keeping the invariant "only this trigger writes the total"
--    while allowing the new insert path. Still infrastructure-only: it
--    aggregates, it never decides whether to grant.
create or replace function public.apply_point_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.registrations
     set total_points = total_points + new.points
   where event_id = new.event_id
     and user_id  = new.user_id;
  return new;
end;
$$;
