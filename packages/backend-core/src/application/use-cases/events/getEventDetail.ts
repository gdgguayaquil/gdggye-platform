import type {
  EventDetail,
  EventDetailAgendaSlot,
  EventDetailSpeaker,
  EventDetailSponsor,
  EventDetailSponsorTiers,
} from "../../../domain/entities/EventDetail";
import type { AgendaSlotRepository } from "../../ports/AgendaSlotRepository";
import type { EventContentRepository } from "../../ports/EventContentRepository";
import type { EventSpeakerRepository } from "../../ports/EventSpeakerRepository";
import type { EventSponsorRepository } from "../../ports/EventSponsorRepository";
import type { SpeakerRepository } from "../../ports/SpeakerRepository";
import type { SponsorRepository } from "../../ports/SponsorRepository";

export interface GetEventDetailDeps {
  contentRepo: EventContentRepository;
  agendaSlotRepo: AgendaSlotRepository;
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
//
// We unify the speaker lookup across event_speakers AND agenda speakers,
// because a single-slot guest speaker (not formally attached to the event)
// still needs photo/name resolved for the agenda render.
export async function getEventDetail(
  eventId: string,
  deps: GetEventDetailDeps,
): Promise<EventDetail> {
  const [content, eventSpeakers, eventSponsors, agendaSlots, slotSpeakerLinks] =
    await Promise.all([
      deps.contentRepo.findByEventId(eventId),
      deps.eventSpeakerRepo.listForEvent(eventId),
      deps.eventSponsorRepo.listForEvent(eventId),
      deps.agendaSlotRepo.listForEvent(eventId),
      deps.agendaSlotRepo.listSpeakerLinksForEvent(eventId),
    ]);

  // Union of every speaker id this page might mention.
  const speakerIds = new Set<string>();
  for (const es of eventSpeakers) speakerIds.add(es.speakerId);
  for (const l of slotSpeakerLinks) speakerIds.add(l.speakerId);

  const [speakers, sponsors] = await Promise.all([
    deps.speakerRepo.findManyByIds([...speakerIds]),
    Promise.all(
      eventSponsors.map((es) => deps.sponsorRepo.findById(es.sponsorId)),
    ),
  ]);

  const speakerIndex = new Map(speakers.map((s) => [s.id, s]));

  // Speakers section (event_speakers attachments).
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

  // Agenda section. Index slot speakers by slotId for O(slots) composition.
  const slotSpeakersBySlot = new Map<string, typeof slotSpeakerLinks>();
  for (const link of slotSpeakerLinks) {
    const arr = slotSpeakersBySlot.get(link.slotId) ?? [];
    arr.push(link);
    slotSpeakersBySlot.set(link.slotId, arr);
  }

  const agenda: EventDetailAgendaSlot[] = agendaSlots
    .slice()
    .sort(
      (a, b) =>
        a.startAt.getTime() - b.startAt.getTime() ||
        a.displayOrder - b.displayOrder,
    )
    .map((slot) => {
      const links = (slotSpeakersBySlot.get(slot.id) ?? [])
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder);
      return {
        id: slot.id,
        startAt: slot.startAt,
        durationMinutes: slot.durationMinutes,
        titleEs: slot.titleEs,
        titleEn: slot.titleEn,
        track: slot.track,
        room: slot.room,
        displayOrder: slot.displayOrder,
        speakers: links
          .map((link) => {
            const sp = speakerIndex.get(link.speakerId);
            if (!sp) return null;
            return {
              speakerId: sp.id,
              slug: sp.slug,
              name: sp.name,
              photoUrl: sp.photoUrl,
            };
          })
          .filter(
            (x): x is EventDetail["agenda"][number]["speakers"][number] =>
              x !== null,
          ),
      };
    });

  // Sponsors section, bucketed by tier.
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
      gallery: [],
      faq: [],
    },
    agenda,
    speakers: speakerRows,
    sponsorTiers: tiers,
  };
}
