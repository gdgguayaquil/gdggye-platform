import "server-only";

import {
  createSponsor as createSponsorUseCase,
  getSponsor as getSponsorUseCase,
  getSponsorBySlug as getSponsorBySlugUseCase,
  listAllSponsors as listAllSponsorsUseCase,
  searchSponsors as searchSponsorsUseCase,
  updateSponsor as updateSponsorUseCase,
  type CreateSponsorInput,
  type SearchSponsorsInput,
  type UpdateSponsorInput,
} from "@gdggye/backend-core";
import { SupabaseSponsorRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { sponsorRepo: new SupabaseSponsorRepository(supabase) };
}

export async function listAllSponsors() {
  return listAllSponsorsUseCase(await deps());
}

export async function searchSponsors(input: SearchSponsorsInput) {
  return searchSponsorsUseCase(input, await deps());
}

export async function getSponsor(id: string) {
  return getSponsorUseCase(id, await deps());
}

export async function getSponsorBySlug(slug: string) {
  return getSponsorBySlugUseCase(slug, await deps());
}

export async function createSponsor(input: CreateSponsorInput) {
  return createSponsorUseCase(input, await deps());
}

export async function updateSponsor(id: string, patch: UpdateSponsorInput) {
  return updateSponsorUseCase(id, patch, await deps());
}
