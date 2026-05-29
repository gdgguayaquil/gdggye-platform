import "server-only";

import {
  createSponsor as createSponsorUseCase,
  getSponsor as getSponsorUseCase,
  listSponsorsForEvent as listSponsorsForEventUseCase,
  setSponsorActive as setSponsorActiveUseCase,
  updateSponsor as updateSponsorUseCase,
  type CreateSponsorInput,
  type UpdateSponsorInput,
} from "@gdggye/backend-core";
import { SupabaseSponsorRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { sponsorRepo: new SupabaseSponsorRepository(supabase) };
}

export async function listSponsorsForEvent(eventId: string) {
  return listSponsorsForEventUseCase(eventId, await deps());
}

export async function getSponsor(id: string) {
  return getSponsorUseCase(id, await deps());
}

export async function createSponsor(input: CreateSponsorInput) {
  return createSponsorUseCase(input, await deps());
}

export async function updateSponsor(id: string, patch: UpdateSponsorInput) {
  return updateSponsorUseCase(id, patch, await deps());
}

export async function setSponsorActive(id: string, isActive: boolean) {
  return setSponsorActiveUseCase(id, isActive, await deps());
}
