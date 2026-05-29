import type { Event, EventStatus } from "../domain/entities/Event";
import type {
  CreateEventInput,
  EventRepository,
  ListEventsFilter,
  UpdateEventInput,
} from "../application/ports/EventRepository";

// Pure in-memory implementation used by use-case tests.
// Lives in test-support/ rather than under tests/ so it's importable from
// downstream packages' tests without going through a private path.
export class InMemoryEventRepository implements EventRepository {
  private events: Event[];
  private counter = 0;

  constructor(seed: Event[] = []) {
    this.events = [...seed];
  }

  async findById(id: string): Promise<Event | null> {
    return this.events.find((e) => e.id === id) ?? null;
  }

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

  async create(input: CreateEventInput): Promise<Event> {
    if (this.events.some((e) => e.slug === input.slug)) {
      throw new Error(
        `InMemoryEventRepository.create: slug "${input.slug}" already in use`,
      );
    }
    this.counter += 1;
    const created: Event = {
      id: `evt-${this.counter}`,
      slug: input.slug,
      name: input.name,
      type: input.type,
      year: input.year,
      status: "draft",
      languageMode: input.languageMode ?? "bilingual",
      startAt: input.startAt,
      endAt: input.endAt,
      timezone: input.timezone ?? "America/Guayaquil",
      venueName: input.venueName ?? null,
      venueAddress: input.venueAddress ?? null,
      venueMapUrl: input.venueMapUrl ?? null,
      ticketUrl: input.ticketUrl ?? null,
      preCheckinDeadline: input.preCheckinDeadline ?? null,
      leaderboardEnabled: input.leaderboardEnabled ?? true,
      themeKey: input.themeKey ?? "gdggye-core",
      summaryEs: input.summaryEs ?? null,
      summaryEn: input.summaryEn ?? null,
      expectedAttendance: input.expectedAttendance ?? null,
    };
    this.events.push(created);
    return created;
  }

  async update(id: string, patch: UpdateEventInput): Promise<Event> {
    const existing = this.events.find((e) => e.id === id);
    if (!existing) {
      throw new Error(`InMemoryEventRepository.update: ${id} not found`);
    }
    const updated: Event = { ...existing, ...patch };
    this.events = this.events.map((e) => (e.id === id ? updated : e));
    return updated;
  }

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    return this.update(id, {} as UpdateEventInput).then(async (e) => {
      const next: Event = { ...e, status };
      this.events = this.events.map((x) => (x.id === id ? next : x));
      return next;
    });
  }
}
