import type { AgendaSlot } from "../../domain/entities/AgendaSlot";
import type { AgendaSlotSpeaker } from "../../domain/entities/AgendaSlotSpeaker";

export interface CreateAgendaSlotInput {
  eventId: string;
  startAt: Date;
  durationMinutes: number;
  titleEs: string;
  titleEn: string;
  track?: string | null;
  room?: string;
  displayOrder?: number;
}

export interface UpdateAgendaSlotInput {
  startAt?: Date;
  durationMinutes?: number;
  titleEs?: string;
  titleEn?: string;
  track?: string | null;
  room?: string;
  displayOrder?: number;
}

// Speaker assignments are managed as a "replace the whole set" operation
// from the application's perspective. This matches the admin UX of a
// multi-select control on the slot form. Implementations should do
// delete-all + insert-many in as few round trips as possible.
export interface SpeakerAssignment {
  speakerId: string;
  displayOrder: number;
}

export interface AgendaSlotRepository {
  findById(id: string): Promise<AgendaSlot | null>;
  listForEvent(eventId: string): Promise<AgendaSlot[]>;
  create(input: CreateAgendaSlotInput): Promise<AgendaSlot>;
  update(id: string, patch: UpdateAgendaSlotInput): Promise<AgendaSlot>;
  delete(id: string): Promise<void>;

  listSpeakerLinksForSlot(slotId: string): Promise<AgendaSlotSpeaker[]>;
  // Bulk fetch for a hydrated EventDetail read. One round trip beats N
  // sequential lookups when there are 20+ slots.
  listSpeakerLinksForEvent(eventId: string): Promise<AgendaSlotSpeaker[]>;

  // Replaces the slot's full speaker set with the provided assignments.
  // Pass an empty array to clear all speakers from the slot.
  setSpeakers(
    slotId: string,
    assignments: readonly SpeakerAssignment[],
  ): Promise<void>;
}
