import type { EventSpeaker } from "../../../domain/entities/EventSpeaker";
import type {
  AttachSpeakerInput,
  EventSpeakerRepository,
  UpdateEventSpeakerInput,
} from "../../ports/EventSpeakerRepository";

export interface EventSpeakerDeps {
  eventSpeakerRepo: EventSpeakerRepository;
}

export async function listEventSpeakers(
  eventId: string,
  deps: EventSpeakerDeps,
): Promise<EventSpeaker[]> {
  return deps.eventSpeakerRepo.listForEvent(eventId);
}

export async function getEventSpeaker(
  id: string,
  deps: EventSpeakerDeps,
): Promise<EventSpeaker | null> {
  return deps.eventSpeakerRepo.findById(id);
}

// Idempotent. Re-attach with new values updates the existing row.
export async function attachSpeakerToEvent(
  input: AttachSpeakerInput,
  deps: EventSpeakerDeps,
): Promise<EventSpeaker> {
  return deps.eventSpeakerRepo.attach(input);
}

export async function updateEventSpeaker(
  id: string,
  patch: UpdateEventSpeakerInput,
  deps: EventSpeakerDeps,
): Promise<EventSpeaker> {
  return deps.eventSpeakerRepo.update(id, patch);
}

export async function detachSpeakerFromEvent(
  id: string,
  deps: EventSpeakerDeps,
): Promise<void> {
  return deps.eventSpeakerRepo.detach(id);
}

export async function setEventSpeakerActive(
  id: string,
  isActive: boolean,
  deps: EventSpeakerDeps,
): Promise<EventSpeaker> {
  return deps.eventSpeakerRepo.update(id, { isActive });
}
