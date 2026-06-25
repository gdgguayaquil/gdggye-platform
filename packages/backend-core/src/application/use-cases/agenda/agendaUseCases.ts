import type { AgendaSlot } from "../../../domain/entities/AgendaSlot";
import type {
  AgendaSlotRepository,
  CreateAgendaSlotInput,
  SpeakerAssignment,
  UpdateAgendaSlotInput,
} from "../../ports/AgendaSlotRepository";

export type AgendaValidationReason =
  | "blank_title"
  | "negative_duration"
  | "invalid_start_at";

export class AgendaValidationError extends Error {
  constructor(public readonly reason: AgendaValidationReason) {
    super(`Agenda validation failed: ${reason}`);
    this.name = "AgendaValidationError";
  }
}

function validateCreate(input: CreateAgendaSlotInput): void {
  if (input.titleEs.trim().length === 0 && input.titleEn.trim().length === 0) {
    throw new AgendaValidationError("blank_title");
  }
  if (input.durationMinutes < 0) {
    throw new AgendaValidationError("negative_duration");
  }
  if (Number.isNaN(input.startAt.getTime())) {
    throw new AgendaValidationError("invalid_start_at");
  }
}

function validateUpdate(patch: UpdateAgendaSlotInput): void {
  if (patch.titleEs !== undefined && patch.titleEn !== undefined) {
    if (
      patch.titleEs.trim().length === 0 &&
      patch.titleEn.trim().length === 0
    ) {
      throw new AgendaValidationError("blank_title");
    }
  }
  if (patch.durationMinutes !== undefined && patch.durationMinutes < 0) {
    throw new AgendaValidationError("negative_duration");
  }
  if (patch.startAt !== undefined && Number.isNaN(patch.startAt.getTime())) {
    throw new AgendaValidationError("invalid_start_at");
  }
}

export interface AgendaDeps {
  agendaSlotRepo: AgendaSlotRepository;
}

export async function listAgendaSlots(
  eventId: string,
  deps: AgendaDeps,
): Promise<AgendaSlot[]> {
  return deps.agendaSlotRepo.listForEvent(eventId);
}

export async function getAgendaSlot(
  id: string,
  deps: AgendaDeps,
): Promise<AgendaSlot | null> {
  return deps.agendaSlotRepo.findById(id);
}

export async function createAgendaSlot(
  input: CreateAgendaSlotInput,
  deps: AgendaDeps,
): Promise<AgendaSlot> {
  validateCreate(input);
  return deps.agendaSlotRepo.create(input);
}

export async function updateAgendaSlot(
  id: string,
  patch: UpdateAgendaSlotInput,
  deps: AgendaDeps,
): Promise<AgendaSlot> {
  validateUpdate(patch);
  return deps.agendaSlotRepo.update(id, patch);
}

export async function deleteAgendaSlot(
  id: string,
  deps: AgendaDeps,
): Promise<void> {
  return deps.agendaSlotRepo.delete(id);
}

// Replaces the slot's speaker set. Caller supplies the desired final
// state (ids + order); the adapter swaps it in atomically as far as the
// app is concerned. Pass an empty list to detach all speakers from the
// slot.
export async function setAgendaSlotSpeakers(
  slotId: string,
  assignments: readonly SpeakerAssignment[],
  deps: AgendaDeps,
): Promise<void> {
  return deps.agendaSlotRepo.setSpeakers(slotId, assignments);
}
