import Link from "next/link";

import { Button } from "@gdggye/ui-kit";

import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listAllSponsors } from "@/lib/server/sponsors";

// 4-column grid. Set via inline style — see events/page.tsx for the
// Tailwind v4 arbitrary-grid rationale.
const SPONSOR_COLS = "minmax(0, 2fr) 160px 140px 120px";

export default async function SponsorsListPage() {
  await requireStaff();
  const sponsors = await listAllSponsors();

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Sponsors" }]}
        title="Sponsors"
        subtitle={
          <>
            {sponsors.length} {sponsors.length === 1 ? "sponsor" : "sponsors"} —
            reusable across events.
          </>
        }
        actions={
          <Link href="/sponsors/new">
            <Button variant="primary">+ New sponsor</Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SPONSOR_COLS }}
        >
          <div>Name</div>
          <div>Slug</div>
          <div>Default tier</div>
          <div />
        </div>
        {sponsors.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No sponsors yet. Create one to attach to events.
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
                {s.slug}
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {s.defaultTier ?? "—"}
              </div>
              <div className="text-right">
                <Link href={`/sponsors/${s.id}/edit`}>
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
