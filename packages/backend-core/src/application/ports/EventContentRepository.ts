import type { EventContent } from "../../domain/entities/EventContent";

export interface EventContentRepository {
  findByEventId(eventId: string): Promise<EventContent | null>;
}
