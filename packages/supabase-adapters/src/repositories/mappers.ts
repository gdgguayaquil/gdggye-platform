import type { Database } from "@gdggye/types";
import type {
  Event,
  EventContent,
  AgendaSlot,
  FAQ,
  Speaker,
  SponsorTiers,
} from "@gdggye/backend-core";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventContentRow = Database["public"]["Tables"]["event_content"]["Row"];

// Map a DB row to a domain Event. Dates are parsed; nullable fields are
// preserved. Anything DB-specific (created_at) is dropped.
export function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    year: row.year,
    status: row.status,
    languageMode: row.language_mode,
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    timezone: row.timezone,
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    venueMapUrl: row.venue_map_url,
    ticketUrl: row.ticket_url,
    preCheckinDeadline: row.pre_checkin_deadline
      ? new Date(row.pre_checkin_deadline)
      : null,
    leaderboardEnabled: row.leaderboard_enabled,
    themeKey: row.theme_key,
    summaryEs: row.summary_es,
    summaryEn: row.summary_en,
    expectedAttendance: row.expected_attendance,
  };
}

function emptyTiers(): SponsorTiers {
  return { platinum: [], gold: [], silver: [], community: [] };
}

// JSONB columns come back as `Json`, which is a recursive union. We narrow
// to the expected shape at the boundary. If the data is malformed, the
// downstream typed fields just come back empty — better than crashing the
// render.
export function rowToEventContent(row: EventContentRow): EventContent {
  return {
    eventId: row.event_id,
    hero: (row.hero ?? {}) as unknown as EventContent["hero"],
    agenda: Array.isArray(row.agenda)
      ? (row.agenda as unknown as AgendaSlot[])
      : [],
    speakers: Array.isArray(row.speakers)
      ? (row.speakers as unknown as Speaker[])
      : [],
    sponsors:
      row.sponsors &&
      typeof row.sponsors === "object" &&
      !Array.isArray(row.sponsors)
        ? { ...emptyTiers(), ...(row.sponsors as unknown as SponsorTiers) }
        : emptyTiers(),
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    faq: Array.isArray(row.faq) ? (row.faq as unknown as FAQ[]) : [],
  };
}
