import type {
  EventDetail,
  EventDetailSpeaker,
  EventDetailSponsor,
  EventDetailSponsorTiers,
} from "../../../domain/entities/EventDetail";
import type { EventContentRepository } from "../../ports/EventContentRepository";
import type { EventSpeakerRepository } from "../../ports/EventSpeakerRepository";
import type { EventSponsorRepository } from "../../ports/EventSponsorRepository";
import type { SpeakerRepository } from "../../ports/SpeakerRepository";
import type { SponsorRepository } from "../../ports/SponsorRepository";

export interface GetEventDetailDeps {
  contentRepo: EventContentRepository;
  eventSpeakerRepo: EventSpeakerRepository;
  speakerRepo: SpeakerRepository;
  eventSponsorRepo: EventSponsorRepository;
  sponsorRepo: SponsorRepository;
}

const KNOWN_TIERS = ["platinum", "gold", "silver", "community"] as const;
type KnownTier = (typeof KNOWN_TIERS)[number];

function emptyTiers(): EventDetailSponsorTiers {
  return { platinum: [], gold: [], silver: [], community: [], other: [] };
}

function bucketFor(tier: string | null): keyof EventDetailSponsorTiers {
  if (!tier) return "other";
  const lower = tier.toLowerCase();
  return (KNOWN_TIERS as readonly string[]).includes(lower)
    ? (lower as KnownTier)
    : "other";
}

// Returns the full marketing view in one call. Falls back to empty content
// (instead of null) when the event has no event_content row yet — the
// marketing site shouldn't 404 just because a draft event has no copy.
export async function getEventDetail(
  eventId: string,
  deps: GetEventDetailDeps,
): Promise<EventDetail> {
  const [content, eventSpeakers, eventSponsors] = await Promise.all([
    deps.contentRepo.findByEventId(eventId),
    deps.eventSpeakerRepo.listForEvent(eventId),
    deps.eventSponsorRepo.listForEvent(eventId),
  ]);

  const [speakers, sponsors] = await Promise.all([
    deps.speakerRepo.findManyByIds(eventSpeakers.map((es) => es.speakerId)),
    Promise.all(
      eventSponsors.map((es) => deps.sponsorRepo.findById(es.sponsorId)),
    ),
  ]);

  const speakerIndex = new Map(speakers.map((s) => [s.id, s]));
  const speakerRows: EventDetailSpeaker[] = eventSpeakers
    .filter((es) => es.isActive)
    .map<EventDetailSpeaker | null>((es) => {
      const sp = speakerIndex.get(es.speakerId);
      if (!sp) return null;
      return {
        attachmentId: es.id,
        speaker: sp,
        displayOrder: es.displayOrder,
        track: es.track,
        isHeadliner: es.isHeadliner,
        isActive: es.isActive,
      };
    })
    .filter((x): x is EventDetailSpeaker => x !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const sponsorIndex = new Map(
    sponsors
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => [s.id, s]),
  );
  const tiers = emptyTiers();
  for (const es of eventSponsors) {
    if (!es.isActive) continue;
    const sp = sponsorIndex.get(es.sponsorId);
    if (!sp) continue;
    const row: EventDetailSponsor = {
      attachmentId: es.id,
      sponsor: {
        id: sp.id,
        slug: sp.slug,
        name: sp.name,
        logoUrl: sp.logoUrl,
        websiteUrl: sp.websiteUrl,
        description: sp.description,
      },
      tier: es.tier,
      boothLabel: es.boothLabel,
      isActive: es.isActive,
    };
    tiers[bucketFor(es.tier)].push(row);
  }

  return {
    content: content ?? {
      eventId,
      hero: {},
      agenda: [],
      gallery: [],
      faq: [],
    },
    speakers: speakerRows,
    sponsorTiers: tiers,
  };
}
