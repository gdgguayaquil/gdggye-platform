import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { getActivity } from "@/lib/server/activities";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listSponsorsForEvent } from "@/lib/server/sponsors";

import { ActivityForm, type ActivityFormValues } from "../../ActivityForm";

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

  const [event, activity, sponsors] = await Promise.all([
    findEventById(id),
    getActivity(activityId),
    listSponsorsForEvent(id),
  ]);
  if (!event || !activity || activity.eventId !== id) notFound();

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

  return (
    <div className="container-x py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">
            <Link href={`/events/${id}/activities`}>
              ← {event.name} / Activities
            </Link>
          </div>
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            {activity.name}
          </h1>
        </div>
        <Link href={`/events/${id}/activities`}>
          <Button variant="secondary">← All activities</Button>
        </Link>
      </div>
      <ActivityForm mode="edit" initial={initial} sponsors={sponsors} />
    </div>
  );
}
