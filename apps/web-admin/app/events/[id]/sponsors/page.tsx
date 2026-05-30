import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listSponsorsForEvent } from "@/lib/server/sponsors";

// 5-column grid for the sponsors table. Set via inline style because
// Tailwind v4 doesn't always emit arbitrary `grid-cols-[…]` classes with
// multiple track values reliably.
const SPONSOR_COLS = "minmax(0, 2fr) 140px 120px 120px 120px";

export default async function SponsorsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const event = await findEventById(id);
  if (!event) notFound();

  const sponsors = await listSponsorsForEvent(id);

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Sponsors" },
        ]}
        title="Sponsors"
        subtitle={`${sponsors.length} sponsor${sponsors.length === 1 ? "" : "s"} attached to this event.`}
        actions={
          <Link href={`/events/${id}/sponsors/new`}>
            <Button variant="primary">+ New sponsor</Button>
          </Link>
        }
      />

      <EventSubNav eventId={id} active="sponsors" />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SPONSOR_COLS }}
        >
          <div>Name</div>
          <div>Tier</div>
          <div>Booth</div>
          <div>Active</div>
          <div />
        </div>
        {sponsors.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No sponsors yet.
          </div>
        ) : (
          sponsors.map((s) => (
            <div
              key={s.id}
              className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: SPONSOR_COLS }}
            >
              <div>
                <div className="font-display font-semibold">{s.name}</div>
                {s.description ? (
                  <div className="text-xs text-[var(--c-text-subtle)]">
                    {s.description}
                  </div>
                ) : null}
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {s.tier ?? "—"}
              </div>
              <div className="font-mono text-xs">{s.boothLabel ?? "—"}</div>
              <div>
                <span
                  className={`chip ${
                    s.isActive ? "chip-green" : "chip-neutral"
                  }`}
                >
                  {s.isActive ? "active" : "inactive"}
                </span>
              </div>
              <div className="text-right">
                <Link href={`/events/${id}/sponsors/${s.id}/edit`}>
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
