import type {
  Event,
  EventStatus,
  EventType,
  LanguageMode,
} from "../../domain/entities/Event";

export interface ListEventsFilter {
  status?: EventStatus[];
  year?: number;
}

export interface CreateEventInput {
  slug: string;
  name: string;
  type: EventType;
  year: number;
  languageMode?: LanguageMode;
  startAt: Date;
  endAt: Date;
  timezone?: string;
  venueName?: string | null;
  venueAddress?: string | null;
  venueMapUrl?: string | null;
  ticketUrl?: string | null;
  preCheckinDeadline?: Date | null;
  leaderboardEnabled?: boolean;
  themeKey?: string;
  summaryEs?: string | null;
  summaryEn?: string | null;
  expectedAttendance?: string | null;
}

export interface UpdateEventInput {
  name?: string;
  type?: EventType;
  year?: number;
  languageMode?: LanguageMode;
  startAt?: Date;
  endAt?: Date;
  timezone?: string;
  venueName?: string | null;
  venueAddress?: string | null;
  venueMapUrl?: string | null;
  ticketUrl?: string | null;
  preCheckinDeadline?: Date | null;
  leaderboardEnabled?: boolean;
  themeKey?: string;
  summaryEs?: string | null;
  summaryEn?: string | null;
  expectedAttendance?: string | null;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  list(filter?: ListEventsFilter): Promise<Event[]>;
  create(input: CreateEventInput): Promise<Event>;
  update(id: string, patch: UpdateEventInput): Promise<Event>;
  updateStatus(id: string, status: EventStatus): Promise<Event>;
}
