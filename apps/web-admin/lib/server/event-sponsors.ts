import "server-only";

import {
  attachSponsorToEvent as attachSponsorToEventUseCase,
  detachSponsorFromEvent as detachSponsorFromEventUseCase,
  getEventSponsor as getEventSponsorUseCase,
  listEventSponsors as listEventSponsorsUseCase,
  setEventSponsorActive as setEventSponsorActiveUseCase,
  updateEventSponsor as updateEventSponsorUseCase,
  type AttachSponsorInput,
  type EventSponsor,
  type Sponsor,
  type UpdateEventSponsorInput,
} from "@gdggye/backend-core";
import { SupabaseEventSponsorRepository } from "@gdggye/supabase-adapters";

import { listAllSponsors } from "./sponsors";
import { getSupabaseServerClient } from "./supabase";

async function deps() {
  const supabase = await getSupabaseServerClient();
  return { eventSponsorRepo: new SupabaseEventSponsorRepository(supabase) };
}

export async function listEventSponsors(eventId: string) {
  return listEventSponsorsUseCase(eventId, await deps());
}

export async function getEventSponsor(id: string) {
  return getEventSponsorUseCase(id, await deps());
}

export async function attachSponsorToEvent(input: AttachSponsorInput) {
  return attachSponsorToEventUseCase(input, await deps());
}

export async function updateEventSponsor(
  id: string,
  patch: UpdateEventSponsorInput,
) {
  return updateEventSponsorUseCase(id, patch, await deps());
}

export async function detachSponsorFromEvent(id: string) {
  return detachSponsorFromEventUseCase(id, await deps());
}

export async function setEventSponsorActive(id: string, isActive: boolean) {
  return setEventSponsorActiveUseCase(id, isActive, await deps());
}

// Hydrated view: attachment + the underlying global sponsor identity. The
// caller wants both in one shot (sponsor name/logo/slug + per-event
// tier/booth/active), and the global sponsor list is small enough to fetch
// in full and zip in memory.
export interface AttachedSponsor {
  attachment: EventSponsor;
  sponsor: Sponsor;
}

export async function listAttachedSponsors(
  eventId: string,
): Promise<AttachedSponsor[]> {
  const [attachments, sponsors] = await Promise.all([
    listEventSponsors(eventId),
    listAllSponsors(),
  ]);
  const byId = new Map(sponsors.map((s) => [s.id, s]));
  return attachments
    .map<AttachedSponsor | null>((a) => {
      const sponsor = byId.get(a.sponsorId);
      if (!sponsor) return null; // orphaned attachment; skip.
      return { attachment: a, sponsor };
    })
    .filter((x): x is AttachedSponsor => x !== null);
}
