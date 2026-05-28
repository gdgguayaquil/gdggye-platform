// Domain entity: Event
// Shape that the application layer reasons about. Mirrors the `events` row
// but with proper Date types and no DB-specific fields (no `created_at` exposed
// to callers, for example — that's repository concern).

export type EventType =
  | "devfest"
  | "build_with_ai"
  | "google_io"
  | "meetup"
  | "tech_talk"
  | "conference"
  | "workshop"
  | "hackathon";

export type EventStatus = "draft" | "published" | "live" | "closed";

export type LanguageMode = "es" | "en" | "bilingual";

export interface Event {
  id: string;
  slug: string;
  name: string;
  type: EventType;
  year: number;
  status: EventStatus;
  languageMode: LanguageMode;
  startAt: Date;
  endAt: Date;
  timezone: string;
  venueName: string | null;
  venueAddress: string | null;
  venueMapUrl: string | null;
  ticketUrl: string | null;
  preCheckinDeadline: Date | null;
  leaderboardEnabled: boolean;
  themeKey: string;
  summaryEs: string | null;
  summaryEn: string | null;
  expectedAttendance: string | null;
}

// Domain rule: an Event with status='draft' should never be exposed to the public.
// Use-cases that serve public consumers must filter these out.
export function isPublicVisible(event: Event): boolean {
  return event.status !== "draft";
}
