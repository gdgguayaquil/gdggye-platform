-- 0010_leaderboard.sql
-- Sprint 5 (Phase 2 keystone): live leaderboard + my-stats.
--
-- This migration:
--   1. Adds `registrations` to the supabase_realtime publication so the
--      bwai-2026 app can subscribe to point updates as scans land.
--   2. Replaces the self-only registrations SELECT policy with an
--      event-scoped public read (mirrors the pattern used for sponsors,
--      speakers, and agenda). Attendees of a visible event can see each
--      other's totals — that *is* what a leaderboard is.
--   3. Adds two SECURITY DEFINER RPCs:
--        - get_event_leaderboard(event_id, limit) → top-N rows joined to
--          users (id, full_name, photo_url, total_points, rank).
--        - get_user_event_rank(event_id, user_id) → just (total, rank).
--      Bypassing RLS lets us expose only the safe fields from public.users
--      (no email, no consents) without weakening the row-level policy.

-- ─────────── 1. Realtime publication ────────────────────────────────
alter publication supabase_realtime add table public.registrations;

-- ─────────── 2. Loosen registrations select policy ──────────────────
drop policy if exists reg_self_read on public.registrations;

create policy registrations_event_scoped_read on public.registrations
  for select using (
    exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and e.status in ('published', 'live', 'closed')
    )
    or public.is_staff()
  );

-- ─────────── 3a. Top-N leaderboard RPC ──────────────────────────────
-- rank() with deterministic tie-break: same points → earlier registration
-- ranks higher. Keeps results stable across realtime ticks.
create or replace function public.get_event_leaderboard(
  p_event_id uuid,
  p_limit    int default 20
)
returns table (
  user_id       uuid,
  full_name     text,
  photo_url     text,
  total_points  integer,
  rank          integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      r.user_id,
      coalesce(u.full_name, '') as full_name,
      u.photo_url,
      r.total_points,
      rank() over (order by r.total_points desc, r.created_at asc)::int as rank
    from public.registrations r
    join public.users u on u.id = r.user_id
    where r.event_id = p_event_id
  )
  select user_id, full_name, photo_url, total_points, rank
  from ranked
  order by rank, full_name
  limit greatest(p_limit, 1);
$$;

-- ─────────── 3b. Single-user rank RPC ───────────────────────────────
-- Used to pin "you are here" at the bottom when the viewer is outside
-- the top-N. Caller's auth.uid() is irrelevant — the function returns
-- rank for whichever user_id is asked.
create or replace function public.get_user_event_rank(
  p_event_id uuid,
  p_user_id  uuid
)
returns table (
  total_points  integer,
  rank          integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      r.user_id,
      r.total_points,
      rank() over (order by r.total_points desc, r.created_at asc)::int as rank
    from public.registrations r
    where r.event_id = p_event_id
  )
  select total_points, rank
  from ranked
  where user_id = p_user_id;
$$;

-- Lock down execute. authenticated for normal app reads; anon for the
-- public marketing page in case a not-signed-in visitor lands on
-- /leaderboard. service_role for admin tooling. Public (the catch-all
-- pseudo-role) gets nothing.
revoke execute on function public.get_event_leaderboard(uuid, int)   from public;
revoke execute on function public.get_user_event_rank(uuid, uuid)    from public;
grant  execute on function public.get_event_leaderboard(uuid, int)   to authenticated, anon, service_role;
grant  execute on function public.get_user_event_rank(uuid, uuid)    to authenticated, anon, service_role;
