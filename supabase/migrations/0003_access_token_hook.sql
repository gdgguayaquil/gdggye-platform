-- 0003_access_token_hook.sql
-- Custom Access Token hook: injects public.users.system_role into the JWT.
--
-- Without this, `auth.jwt() ->> 'system_role'` is null in RLS and every
-- staff policy fails closed. Default to 'attendee' when the users row
-- isn't there yet (first sign-in race between auth.users insert and the
-- signInBootstrap use-case).
--
-- After applying this migration, REGISTER the function in Supabase Auth:
--   • Local: supabase/config.toml under [auth.hook.custom_access_token]
--   • Cloud: Auth → Hooks → Custom Access Token → set to public.custom_access_token_hook
-- Without registration the function exists but isn't called.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  uid    uuid;
  role   text;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  uid    := (event ->> 'user_id')::uuid;

  select system_role::text into role
    from public.users
   where id = uid;

  claims := jsonb_set(claims, '{system_role}', to_jsonb(coalesce(role, 'attendee')));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Allow Supabase Auth's `supabase_auth_admin` role to call the function.
grant execute on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;

-- Belt-and-suspenders: deny execution to everyone else (security definer
-- means it would otherwise run with the function owner's privileges).
revoke execute on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;
