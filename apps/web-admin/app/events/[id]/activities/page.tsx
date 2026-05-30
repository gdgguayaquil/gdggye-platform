import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { listActivitiesForEvent } from "@/lib/server/activities";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listSponsorsForEvent } from "@/lib/server/sponsors";

// See sponsors/page.tsx for the rationale on inline grid templates.
const ACTIVITY_COLS = "minmax(0, 2fr) minmax(0, 1fr) 100px 120px 120px";

export default async function ActivitiesListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const [event, activities, sponsors] = await Promise.all([
    findEventById(id),
    listActivitiesForEvent(id),
    listSponsorsForEvent(id),
  ]);
  if (!event) notFound();

  const sponsorName = (sponsorId: string) =>
    sponsors.find((s) => s.id === sponsorId)?.name ?? sponsorId;

  const noSponsors = sponsors.length === 0;

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Activities" },
        ]}
        title="Activities"
        subtitle={`${activities.length} activit${activities.length === 1 ? "y" : "ies"}.`}
        actions={
          noSponsors ? (
            <Link href={`/events/${id}/sponsors/new`}>
              <Button variant="secondary">+ Add a sponsor first</Button>
            </Link>
          ) : (
            <Link href={`/events/${id}/activities/new`}>
              <Button variant="primary">+ New activity</Button>
            </Link>
          )
        }
      />

      <EventSubNav eventId={id} active="activities" />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: ACTIVITY_COLS }}
        >
          <div>Name</div>
          <div>Sponsor</div>
          <div>Points</div>
          <div>Active</div>
          <div />
        </div>
        {activities.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No activities yet.
          </div>
        ) : (
          activities.map((a) => (
            <div
              key={a.id}
              className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: ACTIVITY_COLS }}
            >
              <div className="font-display font-semibold">{a.name}</div>
              <div className="text-sm">{sponsorName(a.sponsorId)}</div>
              <div className="font-mono text-sm">{a.points}</div>
              <div>
                <span
                  className={`chip ${
                    a.isActive ? "chip-green" : "chip-neutral"
                  }`}
                >
                  {a.isActive ? "active" : "inactive"}
                </span>
              </div>
              <div className="text-right">
                <Link href={`/events/${id}/activities/${a.id}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
