// Hydrated read model for the marketing pages. EventContent (hero/agenda/
// gallery/faq) is one row in JSONB; speakers + sponsors are now joined from
// real tables. This shape gives the view code everything it needs to render
// /events/[slug] in one pass.
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

// What the marketing site needs per sponsor at this event. Same idea as
// EventDetailSpeaker: per-event tier + booth + active, plus the global
// sponsor identity for logo/name/website.
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

export interface EventDetail {
  content: EventContent;
  speakers: EventDetailSpeaker[];
  sponsorTiers: EventDetailSponsorTiers;
}
