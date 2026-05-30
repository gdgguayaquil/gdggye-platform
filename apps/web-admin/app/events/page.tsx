import Link from "next/link";

import { Button } from "@gdggye/ui-kit";

import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listAllEvents } from "@/lib/server/events";

const STATUS_COLOR: Record<string, string> = {
  draft: "neutral",
  published: "blue",
  live: "green",
  closed: "yellow",
};

// See sponsors/page.tsx for the rationale on inline grid templates.
const EVENT_COLS = "minmax(0, 2fr) 120px 140px 140px 120px";

export default async function EventsPage() {
  await requireStaff();
  const events = await listAllEvents();

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Events" }]}
        title="Events"
        subtitle={
          <>
            {events.length} {events.length === 1 ? "event" : "events"} —
            including drafts.
          </>
        }
        actions={
          <Link href="/events/new">
            <Button variant="primary">+ New event</Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: EVENT_COLS }}
        >
          <div>Name</div>
          <div>Type</div>
          <div>Year</div>
          <div>Status</div>
          <div />
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No events yet. Create one to get started.
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: EVENT_COLS }}
            >
              <div>
                <div className="font-display font-semibold">{e.name}</div>
                <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                  {e.slug}
                </div>
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {e.type.replace(/_/g, " ")}
              </div>
              <div className="font-mono text-sm">{e.year}</div>
              <div>
                <span
                  className={`chip chip-${STATUS_COLOR[e.status] ?? "neutral"}`}
                >
                  {e.status}
                </span>
              </div>
              <div className="text-right">
                <Link href={`/events/${e.id}/edit`}>
                  <Button variant="secondary">Open</Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
