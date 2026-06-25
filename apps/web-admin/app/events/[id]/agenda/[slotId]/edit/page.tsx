import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { getAgendaSlot, listSpeakerLinksForSlot } from "@/lib/server/agenda";
import { requireStaff } from "@/lib/server/auth";
import { utcToLocalString } from "@/lib/server/event-time";
import { findEventById } from "@/lib/server/events";
import { listAllSpeakers } from "@/lib/server/speakers";

import {
  AgendaSlotForm,
  type AgendaSlotFormValues,
  type SpeakerChoice,
} from "../../AgendaSlotForm";

export default async function EditAgendaSlotPage({
  params,
}: {
  params: Promise<{ id: string; slotId: string }>;
}) {
  await requireStaff();
  const { id, slotId } = await params;

  const [event, slot, speakers] = await Promise.all([
    findEventById(id),
    getAgendaSlot(slotId),
    listAllSpeakers(),
  ]);
  if (!event || !slot || slot.eventId !== id) notFound();

  const links = await listSpeakerLinksForSlot(slot.id);

  const choices: SpeakerChoice[] = speakers.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    photoUrl: s.photoUrl,
  }));

  const initial: AgendaSlotFormValues = {
    id: slot.id,
    eventId: id,
    startAtLocal: utcToLocalString(slot.startAt, event.timezone),
    durationMinutes: slot.durationMinutes,
    titleEs: slot.titleEs,
    titleEn: slot.titleEn,
    track: slot.track,
    room: slot.room,
    displayOrder: slot.displayOrder,
    speakerIds: links
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((l) => l.speakerId),
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Agenda", href: `/events/${id}/agenda` },
          { label: slot.titleEs || slot.titleEn },
        ]}
        title={slot.titleEs || slot.titleEn || "Slot"}
        subtitle={slot.track ?? null}
      />
      <EventSubNav eventId={id} active="agenda" />
      <AgendaSlotForm
        mode="edit"
        initial={initial}
        speakers={choices}
        eventTimezone={event.timezone}
      />
    </div>
  );
}
