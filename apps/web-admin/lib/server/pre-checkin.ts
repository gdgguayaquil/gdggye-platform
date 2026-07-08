import "server-only";

import {
  listPreCheckinForEvent as listForEventUseCase,
  reviewPreCheckin as reviewUseCase,
  type ListPreCheckinFilter,
  type ReviewPreCheckinInput,
} from "@gdggye/backend-core";
import { SupabasePreCheckinSubmissionRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return {
    preCheckinRepo: new SupabasePreCheckinSubmissionRepository(supabase),
  };
}

export async function listPreCheckinForEvent(
  eventId: string,
  filter?: ListPreCheckinFilter,
) {
  return listForEventUseCase(eventId, filter, await deps());
}

export async function reviewPreCheckin(input: ReviewPreCheckinInput) {
  return reviewUseCase(input, await deps());
}
