import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listAttachedSponsors } from "@/lib/server/event-sponsors";
import { findEventById } from "@/lib/server/events";

import {
  ActivityForm,
  type ActivityFormValues,
  type SponsorOption,
} from "../ActivityForm";

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default async function NewActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [event, attached] = await Promise.all([
    findEventById(id),
    listAttachedSponsors(id),
  ]);
  if (!event) notFound();

  const sponsors: SponsorOption[] = attached
    .filter((a) => a.attachment.isActive)
    .map((a) => ({ id: a.sponsor.id, name: a.sponsor.name }));

  const initial: ActivityFormValues = {
    eventId: id,
    sponsorId: sponsors[0]?.id ?? "",
    name: "",
    points: 10,
    startsAtIso: toLocalInput(event.startAt),
    endsAtIso: toLocalInput(event.endAt),
    isActive: true,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Activities", href: `/events/${id}/activities` },
          { label: "New" },
        ]}
        title="New activity"
      />
      <EventSubNav eventId={id} active="activities" />
      <ActivityForm mode="create" initial={initial} sponsors={sponsors} />
    </div>
  );
}
