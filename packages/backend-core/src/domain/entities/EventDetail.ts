// Hydrated read model for the marketing pages. EventContent (hero / gallery
// / faq) is one row in JSONB; agenda, speakers and sponsors are all joined
// from real tables. This shape gives the view code everything it needs to
// render /events/[slug] in one pass.
//
// Marketing views consume this; admin uses the underlying entities directly.

import type { EventContent } from "./EventContent";
import type { Speaker } from "./Speaker";

// What the marketing site renders for each speaker on an event page.
// Carries the per-event presentation knobs alongside the global identity
// (so a "🌟 Keynote" badge can be driven by isHeadliner without touching
// the global Speaker row).
export interface EventDetailSpeaker {
  attachmentId: string;
  speaker: Speaker;
  displayOrder: number;
  track: string | null;
  isHeadliner: boolean;
  isActive: boolean;
}

// What the marketing site needs per sponsor at this event.
export interface EventDetailSponsor {
  attachmentId: string;
  sponsor: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    description: string | null;
  };
  tier: string | null;
  boothLabel: string | null;
  isActive: boolean;
}

// Sponsors grouped by tier for direct render. Tiers we don't know about
// (event-specific custom tiers) fall into `other`.
export interface EventDetailSponsorTiers {
  platinum: EventDetailSponsor[];
  gold: EventDetailSponsor[];
  silver: EventDetailSponsor[];
  community: EventDetailSponsor[];
  other: EventDetailSponsor[];
}

// Per-agenda-slot speaker summary. Just the bits the view needs — avoid
// dragging the full Speaker shape (bio, all socials) through the agenda
// row when only name + photo + slug are rendered.
export interface EventDetailAgendaSpeaker {
  speakerId: string;
  slug: string;
  name: string;
  photoUrl: string | null;
}

export interface EventDetailAgendaSlot {
  id: string;
  startAt: Date;
  durationMinutes: number;
  titleEs: string;
  titleEn: string;
  track: string | null;
  room: string;
  displayOrder: number;
  speakers: EventDetailAgendaSpeaker[];
}

export interface EventDetail {
  content: EventContent;
  agenda: EventDetailAgendaSlot[];
  speakers: EventDetailSpeaker[];
  sponsorTiers: EventDetailSponsorTiers;
}
