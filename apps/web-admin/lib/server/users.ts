import "server-only";

import {
  completeProfile as completeProfileUseCase,
  type CompleteProfileInput,
} from "@gdggye/backend-core";

import { getSupabaseRepos } from "./supabase";

export async function completeProfile(input: CompleteProfileInput) {
  const { userRepo } = await getSupabaseRepos();
  return completeProfileUseCase(input, { userRepo });
}
