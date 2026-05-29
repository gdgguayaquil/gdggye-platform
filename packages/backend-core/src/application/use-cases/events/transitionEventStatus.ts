import type { Event, EventStatus } from "../../../domain/entities/Event";
import type { EventRepository } from "../../ports/EventRepository";

export class InvalidStatusTransition extends Error {
  constructor(
    public readonly from: EventStatus,
    public readonly to: EventStatus,
  ) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = "InvalidStatusTransition";
  }
}

// Domain rule: status moves forward only. Closing a draft makes no sense;
// reopening a closed event would invalidate already-paid points/registrations.
// Sprint 6 may add an admin-override path; v1 forbids.
const ALLOWED_NEXT: Record<EventStatus, readonly EventStatus[]> = {
  draft: ["published"],
  published: ["live", "closed"],
  live: ["closed"],
  closed: [],
};

function canTransition(from: EventStatus, to: EventStatus): boolean {
  return ALLOWED_NEXT[from].includes(to);
}

export interface TransitionEventStatusDeps {
  eventRepo: EventRepository;
}

export async function transitionEventStatus(
  eventId: string,
  next: EventStatus,
  deps: TransitionEventStatusDeps,
): Promise<Event> {
  const event = await deps.eventRepo.findById(eventId);
  if (!event) throw new Error(`Event ${eventId} not found`);
  if (!canTransition(event.status, next)) {
    throw new InvalidStatusTransition(event.status, next);
  }
  return deps.eventRepo.updateStatus(eventId, next);
}

// Epic G1 — convenience wrappers.
export async function publishEvent(
  eventId: string,
  deps: TransitionEventStatusDeps,
): Promise<Event> {
  return transitionEventStatus(eventId, "published", deps);
}

export async function goLive(
  eventId: string,
  deps: TransitionEventStatusDeps,
): Promise<Event> {
  return transitionEventStatus(eventId, "live", deps);
}

export async function closeEvent(
  eventId: string,
  deps: TransitionEventStatusDeps,
): Promise<Event> {
  return transitionEventStatus(eventId, "closed", deps);
}
