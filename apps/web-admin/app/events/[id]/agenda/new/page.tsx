import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { utcToLocalString } from "@/lib/server/event-time";
import { findEventById } from "@/lib/server/events";
import { listAllSpeakers } from "@/lib/server/speakers";

import {
  AgendaSlotForm,
  type AgendaSlotFormValues,
  type SpeakerChoice,
} from "../AgendaSlotForm";

export default async function NewAgendaSlotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [event, speakers] = await Promise.all([
    findEventById(id),
    listAllSpeakers(),
  ]);
  if (!event) notFound();

  const choices: SpeakerChoice[] = speakers.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    photoUrl: s.photoUrl,
  }));

  // Default the new slot to the event's start moment, formatted in the
  // event timezone so the admin doesn't have to convert mentally.
  const initial: AgendaSlotFormValues = {
    eventId: id,
    startAtLocal: utcToLocalString(event.startAt, event.timezone),
    durationMinutes: 30,
    titleEs: "",
    titleEn: "",
    track: null,
    room: "",
    displayOrder: 0,
    speakerIds: [],
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Agenda", href: `/events/${id}/agenda` },
          { label: "New" },
        ]}
        title="New slot"
      />
      <EventSubNav eventId={id} active="agenda" />
      <AgendaSlotForm
        mode="create"
        initial={initial}
        speakers={choices}
        eventTimezone={event.timezone}
      />
    </div>
  );
}
