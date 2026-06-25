import Link from "next/link";
import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { getEventSpeaker } from "@/lib/server/event-speakers";
import { findEventById } from "@/lib/server/events";
import { getSpeaker } from "@/lib/server/speakers";

import {
  AttachmentEditForm,
  type AttachmentFormValues,
} from "../../AttachmentEditForm";

export default async function EditAttachmentPage({
  params,
}: {
  params: Promise<{ id: string; attachmentId: string }>;
}) {
  await requireStaff();
  const { id, attachmentId } = await params;

  const [event, attachment] = await Promise.all([
    findEventById(id),
    getEventSpeaker(attachmentId),
  ]);
  if (!event || !attachment || attachment.eventId !== id) notFound();

  const speaker = await getSpeaker(attachment.speakerId);
  if (!speaker) notFound();

  const initial: AttachmentFormValues = {
    id: attachment.id,
    eventId: id,
    displayOrder: attachment.displayOrder,
    track: attachment.track,
    isHeadliner: attachment.isHeadliner,
    isActive: attachment.isActive,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Speakers", href: `/events/${id}/speakers` },
          { label: speaker.name },
        ]}
        title={speaker.name}
        subtitle={
          <span>
            {speaker.slug}
            {" · "}
            <Link href={`/speakers/${speaker.id}/edit`} className="underline">
              Edit global profile
            </Link>
          </span>
        }
      />
      <EventSubNav eventId={id} active="speakers" />
      <AttachmentEditForm initial={initial} />
    </div>
  );
}
