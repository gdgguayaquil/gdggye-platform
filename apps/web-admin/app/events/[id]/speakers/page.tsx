import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listEventSpeakers } from "@/lib/server/event-speakers";
import { findEventById } from "@/lib/server/events";
import { listAllSpeakers } from "@/lib/server/speakers";

import {
  EventSpeakersManager,
  type AttachmentRow,
  type SpeakerOption,
} from "./EventSpeakersManager";

export default async function EventSpeakersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const [event, attachments, speakers] = await Promise.all([
    findEventById(id),
    listEventSpeakers(id),
    listAllSpeakers(),
  ]);
  if (!event) notFound();

  const speakerIndex = new Map(speakers.map((s) => [s.id, s]));
  const allOptions: SpeakerOption[] = speakers.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    photoUrl: s.photoUrl,
  }));
  const attachmentRows: AttachmentRow[] = attachments
    .map<AttachmentRow | null>((a) => {
      const speaker = speakerIndex.get(a.speakerId);
      if (!speaker) return null;
      return {
        id: a.id,
        speakerId: a.speakerId,
        speaker: {
          id: speaker.id,
          slug: speaker.slug,
          name: speaker.name,
          photoUrl: speaker.photoUrl,
          roleEs: speaker.roleEs,
          roleEn: speaker.roleEn,
        },
        displayOrder: a.displayOrder,
        track: a.track,
        isHeadliner: a.isHeadliner,
        isActive: a.isActive,
      };
    })
    .filter((r): r is AttachmentRow => r !== null);

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Speakers" },
        ]}
        title="Speakers"
        subtitle={`${attachmentRows.length} attached. Reuse from the global list, or create a new speaker.`}
      />
      <EventSubNav eventId={id} active="speakers" />
      <EventSpeakersManager
        eventId={id}
        attachments={attachmentRows}
        allSpeakers={allOptions}
      />
    </div>
  );
}
