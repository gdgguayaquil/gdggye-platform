import "server-only";

import {
  ensureRegistration as ensureRegistrationUseCase,
  type EnsureRegistrationRequest,
} from "@gdggye/backend-core";

import { getSupabaseRepos } from "./supabase";

export async function ensureRegistration(input: EnsureRegistrationRequest) {
  const { eventRepo, registrationRepo, userRepo } = await getSupabaseRepos();
  return ensureRegistrationUseCase(input, {
    userRepo,
    eventRepo,
    registrationRepo,
  });
}
