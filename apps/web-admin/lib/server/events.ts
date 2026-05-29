import "server-only";

import {
  createEvent as createEventUseCase,
  publishEvent as publishEventUseCase,
  transitionEventStatus as transitionEventStatusUseCase,
  updateEvent as updateEventUseCase,
  type CreateEventInput,
  type EventStatus,
  type UpdateEventInput,
} from "@gdggye/backend-core";

import { getSupabaseRepos } from "./supabase";

export async function listAllEvents() {
  const { eventRepo } = await getSupabaseRepos();
  // No status filter — admin sees drafts too.
  return eventRepo.list();
}

export async function findEventById(id: string) {
  const { eventRepo } = await getSupabaseRepos();
  return eventRepo.findById(id);
}

export async function createEvent(input: CreateEventInput) {
  const { eventRepo } = await getSupabaseRepos();
  return createEventUseCase(input, { eventRepo });
}

export async function updateEvent(id: string, patch: UpdateEventInput) {
  const { eventRepo } = await getSupabaseRepos();
  return updateEventUseCase(id, patch, { eventRepo });
}

export async function publishEvent(id: string) {
  const { eventRepo } = await getSupabaseRepos();
  return publishEventUseCase(id, { eventRepo });
}

export async function transitionStatus(id: string, next: EventStatus) {
  const { eventRepo } = await getSupabaseRepos();
  return transitionEventStatusUseCase(id, next, { eventRepo });
}
