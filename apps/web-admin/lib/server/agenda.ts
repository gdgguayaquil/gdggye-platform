import "server-only";

import {
  createAgendaSlot as createAgendaSlotUseCase,
  deleteAgendaSlot as deleteAgendaSlotUseCase,
  getAgendaSlot as getAgendaSlotUseCase,
  listAgendaSlots as listAgendaSlotsUseCase,
  setAgendaSlotSpeakers as setAgendaSlotSpeakersUseCase,
  updateAgendaSlot as updateAgendaSlotUseCase,
  type AgendaSlotSpeaker,
  type CreateAgendaSlotInput,
  type SpeakerAssignment,
  type UpdateAgendaSlotInput,
} from "@gdggye/backend-core";
import { SupabaseAgendaSlotRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { agendaSlotRepo: new SupabaseAgendaSlotRepository(supabase) };
}

export async function listAgendaSlots(eventId: string) {
  return listAgendaSlotsUseCase(eventId, await deps());
}

export async function getAgendaSlot(id: string) {
  return getAgendaSlotUseCase(id, await deps());
}

export async function createAgendaSlot(input: CreateAgendaSlotInput) {
  return createAgendaSlotUseCase(input, await deps());
}

export async function updateAgendaSlot(
  id: string,
  patch: UpdateAgendaSlotInput,
) {
  return updateAgendaSlotUseCase(id, patch, await deps());
}

export async function deleteAgendaSlot(id: string) {
  return deleteAgendaSlotUseCase(id, await deps());
}

export async function setAgendaSlotSpeakers(
  slotId: string,
  assignments: readonly SpeakerAssignment[],
) {
  return setAgendaSlotSpeakersUseCase(slotId, assignments, await deps());
}

export async function listSpeakerLinksForSlot(
  slotId: string,
): Promise<AgendaSlotSpeaker[]> {
  const d = await deps();
  return d.agendaSlotRepo.listSpeakerLinksForSlot(slotId);
}
