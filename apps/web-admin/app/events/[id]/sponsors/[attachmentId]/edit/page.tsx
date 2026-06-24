import Link from "next/link";
import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { getEventSponsor } from "@/lib/server/event-sponsors";
import { findEventById } from "@/lib/server/events";
import { getSponsor } from "@/lib/server/sponsors";

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
    getEventSponsor(attachmentId),
  ]);
  if (!event || !attachment || attachment.eventId !== id) notFound();

  const sponsor = await getSponsor(attachment.sponsorId);
  if (!sponsor) notFound();

  const initial: AttachmentFormValues = {
    id: attachment.id,
    eventId: id,
    tier: attachment.tier,
    boothLabel: attachment.boothLabel,
    isActive: attachment.isActive,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Sponsors", href: `/events/${id}/sponsors` },
          { label: sponsor.name },
        ]}
        title={sponsor.name}
        subtitle={
          <span>
            {sponsor.slug}
            {" · "}
            <Link href={`/sponsors/${sponsor.id}/edit`} className="underline">
              Edit global profile
            </Link>
          </span>
        }
      />
      <EventSubNav eventId={id} active="sponsors" />
      <AttachmentEditForm initial={initial} />
    </div>
  );
}
