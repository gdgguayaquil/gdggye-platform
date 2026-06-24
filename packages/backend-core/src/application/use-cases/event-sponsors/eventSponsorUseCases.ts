import type { EventSponsor } from "../../../domain/entities/EventSponsor";
import type {
  AttachSponsorInput,
  EventSponsorRepository,
  UpdateEventSponsorInput,
} from "../../ports/EventSponsorRepository";

export interface EventSponsorDeps {
  eventSponsorRepo: EventSponsorRepository;
}

export async function listEventSponsors(
  eventId: string,
  deps: EventSponsorDeps,
): Promise<EventSponsor[]> {
  return deps.eventSponsorRepo.listForEvent(eventId);
}

export async function getEventSponsor(
  id: string,
  deps: EventSponsorDeps,
): Promise<EventSponsor | null> {
  return deps.eventSponsorRepo.findById(id);
}

// Idempotent. If the sponsor is already attached to this event, update
// the tier/booth/active fields instead of creating a duplicate. The DB
// unique constraint on (event_id, sponsor_id) is the final guard.
export async function attachSponsorToEvent(
  input: AttachSponsorInput,
  deps: EventSponsorDeps,
): Promise<EventSponsor> {
  return deps.eventSponsorRepo.attach(input);
}

export async function updateEventSponsor(
  id: string,
  patch: UpdateEventSponsorInput,
  deps: EventSponsorDeps,
): Promise<EventSponsor> {
  return deps.eventSponsorRepo.update(id, patch);
}

export async function detachSponsorFromEvent(
  id: string,
  deps: EventSponsorDeps,
): Promise<void> {
  return deps.eventSponsorRepo.detach(id);
}

export async function setEventSponsorActive(
  id: string,
  isActive: boolean,
  deps: EventSponsorDeps,
): Promise<EventSponsor> {
  return deps.eventSponsorRepo.update(id, { isActive });
}
