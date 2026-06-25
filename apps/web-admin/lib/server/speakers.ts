import "server-only";

import {
  createSpeaker as createSpeakerUseCase,
  getSpeaker as getSpeakerUseCase,
  getSpeakerBySlug as getSpeakerBySlugUseCase,
  listAllSpeakers as listAllSpeakersUseCase,
  searchSpeakers as searchSpeakersUseCase,
  updateSpeaker as updateSpeakerUseCase,
  type CreateSpeakerInput,
  type SearchSpeakersInput,
  type UpdateSpeakerInput,
} from "@gdggye/backend-core";
import { SupabaseSpeakerRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { speakerRepo: new SupabaseSpeakerRepository(supabase) };
}

export async function listAllSpeakers() {
  return listAllSpeakersUseCase(await deps());
}

export async function searchSpeakers(input: SearchSpeakersInput) {
  return searchSpeakersUseCase(input, await deps());
}

export async function getSpeaker(id: string) {
  return getSpeakerUseCase(id, await deps());
}

export async function getSpeakerBySlug(slug: string) {
  return getSpeakerBySlugUseCase(slug, await deps());
}

export async function createSpeaker(input: CreateSpeakerInput) {
  return createSpeakerUseCase(input, await deps());
}

export async function updateSpeaker(id: string, patch: UpdateSpeakerInput) {
  return updateSpeakerUseCase(id, patch, await deps());
}
