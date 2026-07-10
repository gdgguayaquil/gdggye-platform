-- Phase 4, Sprint 4.4 — Role management.
-- Lets an admin change any user's system_role, and closes a pre-existing
-- self-escalation hole where users_self_update (id = auth.uid(), no column
-- guard) let anyone set their own system_role via a crafted PostgREST call.

-- 1. Admins may UPDATE any user row (needed to change OTHER users' roles;
--    users_self_update only covers a user's own row). Column discipline is
--    enforced by the app use-case + the trigger below, not by RLS (Postgres
--    RLS can't scope a policy to a single column).
create policy users_admin_role_write on public.users
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Guard system_role at the row level: a change to system_role is allowed
--    only when there is no authenticated user (service-role / SQL migrations /
--    seed, where auth.uid() is null) or the caller is an admin. This blocks an
--    authenticated non-admin from escalating their own role through
--    users_self_update, regardless of which policy permitted the row update.
create or replace function public.guard_system_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.system_role is distinct from old.system_role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change system_role';
  end if;
  return new;
end;
$$;

create trigger users_guard_system_role
  before update on public.users
  for each row execute function public.guard_system_role();
