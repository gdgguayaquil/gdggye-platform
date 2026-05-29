import type { Event, EventType } from "@gdggye/backend-core";

export type EventAccent = "blue" | "green" | "yellow" | "red";

// Color accent is presentation, not domain — derived deterministically from
// the event type. Flagship types get their canonical brand color; generic
// types share `red` as a soft community-calendar accent.
const TYPE_TO_ACCENT: Record<EventType, EventAccent> = {
  build_with_ai: "blue",
  google_io: "yellow",
  devfest: "green",
  meetup: "red",
  tech_talk: "red",
  conference: "red",
  workshop: "red",
  hackathon: "red",
};

export function eventAccent(event: Pick<Event, "type">): EventAccent {
  return TYPE_TO_ACCENT[event.type];
}

// Short label for venue lines on cards/lists when the full venue_name is too
// long. Splits on common separators (—, ·) and returns the first chunk.
export function shortVenue(venueName: string | null): string {
  if (!venueName) return "";
  return venueName.split(/[—·]/)[0]?.trim() || venueName;
}

export function eventSummary(event: Event, lang: "es" | "en"): string {
  return (lang === "es" ? event.summaryEs : event.summaryEn) ?? "";
}
