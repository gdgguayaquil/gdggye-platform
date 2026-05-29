import type { Event } from "../../../domain/entities/Event";
import type {
  EventRepository,
  UpdateEventInput,
} from "../../ports/EventRepository";

import { EventValidationError } from "./createEvent";

export interface UpdateEventDeps {
  eventRepo: EventRepository;
}

// Epic G1 — partial update. Re-validates only the fields the caller
// provided. slug + status are NOT updatable via this path (slug is locked
// after create to keep URLs stable; status is mutated via publishEvent /
// closeEvent only).
export async function updateEvent(
  eventId: string,
  patch: UpdateEventInput,
  deps: UpdateEventDeps,
): Promise<Event> {
  if (patch.name !== undefined && patch.name.trim().length === 0) {
    throw new EventValidationError("blank_name");
  }
  if (
    patch.year !== undefined &&
    (!Number.isInteger(patch.year) || patch.year < 2017 || patch.year > 2100)
  ) {
    throw new EventValidationError("invalid_year");
  }
  if (patch.startAt !== undefined || patch.endAt !== undefined) {
    // Both must be present to re-validate the window cleanly; the route
    // handler is expected to send them together when either changes.
    if (patch.startAt && patch.endAt) {
      if (patch.endAt.getTime() <= patch.startAt.getTime()) {
        throw new EventValidationError("invalid_window");
      }
    }
  }
  return deps.eventRepo.update(eventId, patch);
}
