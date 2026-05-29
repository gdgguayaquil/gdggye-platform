import "server-only";

import {
  createActivity as createActivityUseCase,
  getActivity as getActivityUseCase,
  listActivitiesForEvent as listActivitiesForEventUseCase,
  setActivityActive as setActivityActiveUseCase,
  updateActivity as updateActivityUseCase,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@gdggye/backend-core";
import { SupabaseActivityRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { activityRepo: new SupabaseActivityRepository(supabase) };
}

export async function listActivitiesForEvent(eventId: string) {
  return listActivitiesForEventUseCase(eventId, await deps());
}

export async function getActivity(id: string) {
  return getActivityUseCase(id, await deps());
}

export async function createActivity(input: CreateActivityInput) {
  return createActivityUseCase(input, await deps());
}

export async function updateActivity(id: string, patch: UpdateActivityInput) {
  return updateActivityUseCase(id, patch, await deps());
}

export async function setActivityActive(id: string, isActive: boolean) {
  return setActivityActiveUseCase(id, isActive, await deps());
}
