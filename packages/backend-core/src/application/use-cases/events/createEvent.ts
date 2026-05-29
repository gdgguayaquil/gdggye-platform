import type { Event } from "../../../domain/entities/Event";
import type {
  CreateEventInput,
  EventRepository,
} from "../../ports/EventRepository";

export class EventValidationError extends Error {
  constructor(public readonly reason: EventValidationReason) {
    super(`Event validation failed: ${reason}`);
    this.name = "EventValidationError";
  }
}

export type EventValidationReason =
  | "invalid_slug"
  | "blank_name"
  | "invalid_year"
  | "invalid_window";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function validate(input: CreateEventInput): void {
  if (!input.slug || !SLUG_RE.test(input.slug)) {
    throw new EventValidationError("invalid_slug");
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new EventValidationError("blank_name");
  }
  if (!Number.isInteger(input.year) || input.year < 2017 || input.year > 2100) {
    throw new EventValidationError("invalid_year");
  }
  if (input.endAt.getTime() <= input.startAt.getTime()) {
    throw new EventValidationError("invalid_window");
  }
}

export interface CreateEventDeps {
  eventRepo: EventRepository;
}

// Epic G1 — create draft event. Status starts at `draft` (default from the
// DB column). publishEvent transitions to `published` later.
export async function createEvent(
  input: CreateEventInput,
  deps: CreateEventDeps,
): Promise<Event> {
  validate(input);
  return deps.eventRepo.create(input);
}
