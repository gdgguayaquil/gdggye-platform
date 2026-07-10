import { notFound } from "next/navigation";

import type { BadgeCriteriaType } from "@gdggye/backend-core";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { getEventBadgeStats } from "@/lib/server/badges";
import { findEventById } from "@/lib/server/events";

const COLS = "48px 1fr 200px 100px";

const CRITERIA_LABEL: Record<BadgeCriteriaType, string> = {
  points_total: "Points total",
  sponsor_scans: "Sponsor scans",
  activity_scans: "Activity scans",
  networking_scans: "Networking scans",
  precheckin_approved: "Pre-checkin approved",
};

export default async function BadgesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const event = await findEventById(id);
  if (!event) notFound();

  const stats = await getEventBadgeStats(id);
  const totalAwarded = stats.reduce((sum, s) => sum + s.awarded, 0);

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Badges" },
        ]}
        title="Badges"
        subtitle={`${stats.length} badge${stats.length === 1 ? "" : "s"} · ${totalAwarded} earned across attendees. Definitions are seed-driven in v1.`}
      />
      <EventSubNav eventId={id} active="badges" />

      <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: COLS, minWidth: 560 }}
        >
          <div />
          <div>Badge</div>
          <div>Criteria</div>
          <div className="text-right">Earned</div>
        </div>

        {stats.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No badges configured for this event.
          </div>
        ) : (
          stats.map(({ badge, awarded }) => (
            <div
              key={badge.id}
              className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: COLS, minWidth: 560 }}
            >
              <div className="text-2xl leading-none" aria-hidden>
                {badge.icon ?? "🏅"}
              </div>
              <div className="min-w-0">
                <div className="font-display font-semibold">{badge.name}</div>
                {badge.description ? (
                  <div className="truncate text-xs text-[var(--c-text-subtle)]">
                    {badge.description}
                  </div>
                ) : null}
                {badge.eventId === null ? (
                  <span className="chip chip-neutral mt-1">global</span>
                ) : null}
              </div>
              <div className="text-sm">
                {CRITERIA_LABEL[badge.criteriaType]}
                <span className="ml-1 font-mono text-xs text-[var(--c-text-muted)]">
                  ≥ {badge.threshold}
                </span>
              </div>
              <div className="text-right font-mono text-sm tabular-nums">
                {awarded}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
