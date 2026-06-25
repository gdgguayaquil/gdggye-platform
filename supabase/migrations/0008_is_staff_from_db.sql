-- 0008_is_staff_from_db.sql
-- Make RLS staff/admin checks source of truth = public.users.system_role,
-- not the JWT claim. The custom_access_token_hook still injects the claim
-- so the *frontend* can render role-aware UI without a round trip — but
-- RLS must never depend on a possibly-stale JWT.
--
-- Why this is the right move:
--   1. requireStaff() in the admin app reads public.users.system_role.
--      Before this migration, RLS read auth.jwt() ->> 'system_role'.
--      The two could drift if a user's role changed mid-session, or if a
--      `supabase db reset` recreated the access-token hook function while
--      live JWTs still lacked the claim. Drift symptom: gate lets the
--      admin in, but writes silently no-op (delete) or throw "Cannot
--      coerce the result to a single JSON object" (update with .single()).
--   2. SECURITY DEFINER bypasses RLS *inside* the function, so the lookup
--      against public.users doesn't recurse back through users_self_read
--      → is_staff() → ad infinitum.
--   3. The DB read is a single indexed primary-key lookup. Negligible.

create or replace function public.is_staff() returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.system_role in ('organizer', 'admin')
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.system_role = 'admin'
  );
$$;

-- Lock down: only the auth role chain should be able to call these. Public
-- can't ever invoke them directly, but RLS evaluators (authenticator/
-- authenticated/anon roles) need execute. Postgres' default is "anyone";
-- we narrow to the standard Supabase auth roles for hygiene.
revoke execute on function public.is_staff()  from public;
revoke execute on function public.is_admin()  from public;
grant  execute on function public.is_staff()  to authenticated, anon, service_role;
grant  execute on function public.is_admin()  to authenticated, anon, service_role;
