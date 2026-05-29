import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { listActivitiesForEvent } from "@/lib/server/activities";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listSponsorsForEvent } from "@/lib/server/sponsors";

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">
            <Link href={`/events/${id}/edit`}>← {event.name}</Link>
          </div>
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Activities
          </h1>
          <p className="mt-2 text-[var(--c-text-muted)]">
            {activities.length} activit
            {activities.length === 1 ? "y" : "ies"}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/events/${id}/sponsors`}>
            <Button variant="secondary">← Sponsors</Button>
          </Link>
          {noSponsors ? (
            <span className="text-sm text-[var(--c-text-muted)]">
              Add a sponsor first.
            </span>
          ) : (
            <Link href={`/events/${id}/activities/new`}>
              <Button variant="primary">+ New activity</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div className="grid grid-cols-[2fr_1fr_100px_120px_120px] gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]">
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
              className="grid grid-cols-[2fr_1fr_100px_120px_120px] items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
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
