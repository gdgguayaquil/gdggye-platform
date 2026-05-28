import type { Event } from "../domain/entities/Event";
import type { EventContent } from "../domain/entities/EventContent";

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "evt-1",
    slug: "bwai-2026",
    name: "Build with AI",
    type: "build_with_ai",
    year: 2026,
    status: "published",
    languageMode: "bilingual",
    startAt: new Date("2026-05-23T09:00:00-05:00"),
    endAt: new Date("2026-05-23T19:00:00-05:00"),
    timezone: "America/Guayaquil",
    venueName: "ESPOL",
    venueAddress: "Km 30.5 Vía Perimetral",
    venueMapUrl: null,
    ticketUrl: null,
    preCheckinDeadline: null,
    leaderboardEnabled: true,
    themeKey: "gdggye-core",
    summaryEs: null,
    summaryEn: null,
    expectedAttendance: null,
    ...overrides,
  };
}

export function makeContent(
  overrides: Partial<EventContent> = {},
): EventContent {
  return {
    eventId: "evt-1",
    hero: {},
    agenda: [],
    speakers: [],
    sponsors: { platinum: [], gold: [], silver: [], community: [] },
    gallery: [],
    faq: [],
    ...overrides,
  };
}
