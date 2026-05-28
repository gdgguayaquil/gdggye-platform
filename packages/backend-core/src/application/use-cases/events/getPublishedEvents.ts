import type { Event } from "../../../domain/entities/Event";
import type { EventRepository } from "../../ports/EventRepository";

export interface GetPublishedEventsInput {
  year?: number;
}

export interface GetPublishedEventsDeps {
  eventRepo: EventRepository;
}

// Returns events the public should see: status in (published, live, closed).
// Drafts never leave the boundary — encoded as a domain rule here, not at the
// route handler or DB query level (defense in depth alongside RLS).
export async function getPublishedEvents(
  input: GetPublishedEventsInput,
  deps: GetPublishedEventsDeps,
): Promise<Event[]> {
  const events = await deps.eventRepo.list({
    status: ["published", "live", "closed"],
    ...(input.year !== undefined ? { year: input.year } : {}),
  });
  // Belt-and-suspenders: a misconfigured repo that ignores the filter still
  // can't leak drafts.
  return events.filter((e) => e.status !== "draft");
}
