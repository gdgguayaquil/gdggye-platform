import type { Event } from "../../../domain/entities/Event";
import type { EventRepository } from "../../ports/EventRepository";

export interface GetEventBySlugInput {
  slug: string;
}

export interface GetEventBySlugDeps {
  eventRepo: EventRepository;
}

export async function getEventBySlug(
  input: GetEventBySlugInput,
  deps: GetEventBySlugDeps,
): Promise<Event | null> {
  const event = await deps.eventRepo.findBySlug(input.slug);
  if (!event) return null;
  if (event.status === "draft") return null; // drafts never leave
  return event;
}
