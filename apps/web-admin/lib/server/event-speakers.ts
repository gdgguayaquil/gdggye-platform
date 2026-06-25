import "server-only";

import {
  attachSpeakerToEvent as attachSpeakerToEventUseCase,
  detachSpeakerFromEvent as detachSpeakerFromEventUseCase,
  getEventSpeaker as getEventSpeakerUseCase,
  listEventSpeakers as listEventSpeakersUseCase,
  setEventSpeakerActive as setEventSpeakerActiveUseCase,
  updateEventSpeaker as updateEventSpeakerUseCase,
  type AttachSpeakerInput,
  type EventSpeaker,
  type Speaker,
  type UpdateEventSpeakerInput,
} from "@gdggye/backend-core";
import { SupabaseEventSpeakerRepository } from "@gdggye/supabase-adapters";

import { listAllSpeakers } from "./speakers";
import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { eventSpeakerRepo: new SupabaseEventSpeakerRepository(supabase) };
}

export async function listEventSpeakers(eventId: string) {
  return listEventSpeakersUseCase(eventId, await deps());
}

export async function getEventSpeaker(id: string) {
  return getEventSpeakerUseCase(id, await deps());
}

export async function attachSpeakerToEvent(input: AttachSpeakerInput) {
  return attachSpeakerToEventUseCase(input, await deps());
}

export async function updateEventSpeaker(
  id: string,
  patch: UpdateEventSpeakerInput,
) {
  return updateEventSpeakerUseCase(id, patch, await deps());
}

export async function detachSpeakerFromEvent(id: string) {
  return detachSpeakerFromEventUseCase(id, await deps());
}

export async function setEventSpeakerActive(id: string, isActive: boolean) {
  return setEventSpeakerActiveUseCase(id, isActive, await deps());
}

// Hydrated view: attachment + global speaker identity. Mirrors
// listAttachedSponsors. Caller wants both in one shot.
export interface AttachedSpeaker {
  attachment: EventSpeaker;
  speaker: Speaker;
}

export async function listAttachedSpeakers(
  eventId: string,
): Promise<AttachedSpeaker[]> {
  const [attachments, speakers] = await Promise.all([
    listEventSpeakers(eventId),
    listAllSpeakers(),
  ]);
  const byId = new Map(speakers.map((s) => [s.id, s]));
  return attachments
    .map<AttachedSpeaker | null>((a) => {
      const speaker = byId.get(a.speakerId);
      if (!speaker) return null;
      return { attachment: a, speaker };
    })
    .filter((x): x is AttachedSpeaker => x !== null);
}
