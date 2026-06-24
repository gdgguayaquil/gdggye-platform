import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { getActivity } from "@/lib/server/activities";
import { requireStaff } from "@/lib/server/auth";
import { listAttachedSponsors } from "@/lib/server/event-sponsors";
import { findEventById } from "@/lib/server/events";
import { getSponsor } from "@/lib/server/sponsors";

import {
  ActivityForm,
  type ActivityFormValues,
  type SponsorOption,
} from "../../ActivityForm";

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>;
}) {
  await requireStaff();
  const { id, activityId } = await params;

  const [event, activity, attached] = await Promise.all([
    findEventById(id),
    getActivity(activityId),
    listAttachedSponsors(id),
  ]);
  if (!event || !activity || activity.eventId !== id) notFound();

  const sponsors: SponsorOption[] = attached.map((a) => ({
    id: a.sponsor.id,
    name: a.sponsor.name,
  }));

  // If the activity's sponsor has been detached since creation, fetch its
  // identity directly so the disabled select still shows the name instead
  // of a bare UUID.
  if (
    activity.sponsorId &&
    !sponsors.some((s) => s.id === activity.sponsorId)
  ) {
    const orphan = await getSponsor(activity.sponsorId);
    if (orphan) sponsors.push({ id: orphan.id, name: orphan.name });
  }

  const initial: ActivityFormValues = {
    id: activity.id,
    eventId: id,
    sponsorId: activity.sponsorId,
    name: activity.name,
    points: activity.points,
    startsAtIso: activity.startsAt ? toLocalInput(activity.startsAt) : "",
    endsAtIso: activity.endsAt ? toLocalInput(activity.endsAt) : "",
    isActive: activity.isActive,
  };

  const sponsorName =
    sponsors.find((s) => s.id === activity.sponsorId)?.name ?? null;

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Activities", href: `/events/${id}/activities` },
          { label: activity.name },
        ]}
        title={activity.name}
        subtitle={sponsorName ? `Sponsor · ${sponsorName}` : null}
      />
      <EventSubNav eventId={id} active="activities" />
      <ActivityForm mode="edit" initial={initial} sponsors={sponsors} />
    </div>
  );
}
