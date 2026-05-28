import type { Event } from "../domain/entities/Event";
import type {
  EventRepository,
  ListEventsFilter,
} from "../application/ports/EventRepository";

// Pure in-memory implementation used by use-case tests.
// Lives in test-support/ rather than under tests/ so it's importable from
// downstream packages' tests without going through a private path.
export class InMemoryEventRepository implements EventRepository {
  constructor(private readonly events: Event[] = []) {}

  async findBySlug(slug: string): Promise<Event | null> {
    return this.events.find((e) => e.slug === slug) ?? null;
  }

  async list(filter?: ListEventsFilter): Promise<Event[]> {
    return this.events.filter((e) => {
      if (filter?.status && !filter.status.includes(e.status)) return false;
      if (filter?.year !== undefined && e.year !== filter.year) return false;
      return true;
    });
  }
}
