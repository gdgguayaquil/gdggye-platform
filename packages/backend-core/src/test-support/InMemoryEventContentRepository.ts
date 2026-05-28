import type { EventContent } from "../domain/entities/EventContent";
import type { EventContentRepository } from "../application/ports/EventContentRepository";

export class InMemoryEventContentRepository implements EventContentRepository {
  constructor(private readonly contents: EventContent[] = []) {}

  async findByEventId(eventId: string): Promise<EventContent | null> {
    return this.contents.find((c) => c.eventId === eventId) ?? null;
  }
}
