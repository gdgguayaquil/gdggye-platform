import type { EventContent } from "../../../domain/entities/EventContent";
import type { EventContentRepository } from "../../ports/EventContentRepository";
import type { EventRepository } from "../../ports/EventRepository";

export interface GetEventContentInput {
  slug: string;
}

export interface GetEventContentDeps {
  eventRepo: EventRepository;
  contentRepo: EventContentRepository;
}

// Returns content only for an event the public can see. Drafts: no content.
export async function getEventContent(
  input: GetEventContentInput,
  deps: GetEventContentDeps,
): Promise<EventContent | null> {
  const event = await deps.eventRepo.findBySlug(input.slug);
  if (!event) return null;
  if (event.status === "draft") return null;
  return deps.contentRepo.findByEventId(event.id);
}
