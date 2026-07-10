import Link from "next/link";
import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { getEventOverview } from "@/lib/server/overview";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const event = await findEventById(id);
  if (!event) notFound();

  const o = await getEventOverview(id);

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Overview" },
        ]}
        title={event.name}
        subtitle={`${event.type} · ${event.year} · ${event.status}`}
      />
      <EventSubNav eventId={id} active="overview" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="Registered"
          value={o.registrations}
          href={`/events/${id}/attendees`}
        />
        <Stat
          label="Pre-checkin approved"
          value={o.preCheckin.approved}
          hint={
            o.preCheckin.pending > 0
              ? `${o.preCheckin.pending} pending`
              : undefined
          }
          href={`/events/${id}/pre-checkin`}
        />
        <Stat label="Points granted" value={o.pointsGranted} />
        <Stat
          label="Scans accepted"
          value={o.scansAccepted}
          hint={o.scansRejected > 0 ? `${o.scansRejected} rejected` : undefined}
          href={`/events/${id}/scans`}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-[var(--r-lg)] border border-[var(--c-border)] px-5 py-5 transition-colors hover:border-[var(--c-text-subtle)]">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--c-text-muted)]">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--c-text-muted)]">{hint}</div>
      ) : (
        <div className="mt-1 text-xs">&nbsp;</div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
