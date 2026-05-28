import type { Event, EventStatus } from "../../domain/entities/Event";

export interface ListEventsFilter {
  status?: EventStatus[];
  year?: number;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  list(filter?: ListEventsFilter): Promise<Event[]>;
}
