import "server-only";

import {
  getMyPreCheckin as getMyPreCheckinUseCase,
  submitPreCheckin as submitPreCheckinUseCase,
  type UpsertOwnPreCheckinInput,
} from "@gdggye/backend-core";
import { SupabasePreCheckinSubmissionRepository } from "@gdggye/supabase-adapters";

import { SystemClock } from "./clock";
import { getSupabaseRepos } from "./supabase";

async function deps() {
  const { supabase, eventRepo } = await getSupabaseRepos();
  return {
    preCheckinRepo: new SupabasePreCheckinSubmissionRepository(supabase),
    eventRepo,
    clock: new SystemClock(),
  };
}

export async function getMyPreCheckin(eventId: string, userId: string) {
  const d = await deps();
  return getMyPreCheckinUseCase(eventId, userId, {
    preCheckinRepo: d.preCheckinRepo,
  });
}

export async function submitPreCheckin(input: UpsertOwnPreCheckinInput) {
  const d = await deps();
  return submitPreCheckinUseCase(input, {
    preCheckinRepo: d.preCheckinRepo,
    eventRepo: d.eventRepo,
    clock: d.clock,
  });
}
