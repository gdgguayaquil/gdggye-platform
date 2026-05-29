import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listSponsorsForEvent } from "@/lib/server/sponsors";

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">
            <Link href={`/events/${id}/edit`}>← {event.name}</Link>
          </div>
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Sponsors
          </h1>
          <p className="mt-2 text-[var(--c-text-muted)]">
            {sponsors.length} sponsor
            {sponsors.length === 1 ? "" : "s"} attached to this event.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/events/${id}/activities`}>
            <Button variant="secondary">Activities →</Button>
          </Link>
          <Link href={`/events/${id}/sponsors/new`}>
            <Button variant="primary">+ New sponsor</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div className="grid grid-cols-[2fr_140px_120px_120px_120px] gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]">
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
              className="grid grid-cols-[2fr_140px_120px_120px_120px] items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
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
