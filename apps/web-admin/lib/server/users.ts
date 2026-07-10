import "server-only";

import {
  completeProfile as completeProfileUseCase,
  listUsers as listUsersUseCase,
  setUserRole as setUserRoleUseCase,
  type CompleteProfileInput,
  type SetUserRoleInput,
} from "@gdggye/backend-core";
import { SupabaseUserRepository } from "@gdggye/supabase-adapters";

import { getSupabaseRepos, getSupabaseServerClient } from "./supabase";

export async function completeProfile(input: CompleteProfileInput) {
  const { userRepo } = await getSupabaseRepos();
  return completeProfileUseCase(input, { userRepo });
}

async function adminUserRepo() {
  const supabase = await getSupabaseServerClient();
  return new SupabaseUserRepository(supabase);
}

export async function listUsers(limit?: number, offset?: number) {
  return listUsersUseCase({ userRepo: await adminUserRepo() }, limit, offset);
}

// Runs under the staff server client; the users_admin_role_write RLS policy
// and guard_system_role trigger are the DB-side backstop.
export async function setUserRole(input: SetUserRoleInput) {
  return setUserRoleUseCase(input, { userRepo: await adminUserRepo() });
}
