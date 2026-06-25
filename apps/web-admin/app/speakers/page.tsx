import Link from "next/link";

import { Button } from "@gdggye/ui-kit";

import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listAllSpeakers } from "@/lib/server/speakers";

const SPEAKER_COLS = "60px minmax(0, 2fr) 160px 140px 120px";

export default async function SpeakersListPage() {
  await requireStaff();
  const speakers = await listAllSpeakers();

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Speakers" }]}
        title="Speakers"
        subtitle={
          <>
            {speakers.length} {speakers.length === 1 ? "speaker" : "speakers"} —
            reusable across events.
          </>
        }
        actions={
          <Link href="/speakers/new">
            <Button variant="primary">+ New speaker</Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SPEAKER_COLS }}
        >
          <div />
          <div>Name</div>
          <div>Slug</div>
          <div>City</div>
          <div />
        </div>
        {speakers.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No speakers yet. Create one to attach to events.
          </div>
        ) : (
          speakers.map((s) => (
            <div
              key={s.id}
              className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: SPEAKER_COLS }}
            >
              <div
                className="overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]"
                style={{ width: 40, height: 40 }}
              >
                {s.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xs text-[var(--c-text-muted)]">
                    {s.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <div className="font-display font-semibold">{s.name}</div>
                {s.roleEs ? (
                  <div className="text-xs text-[var(--c-text-subtle)]">
                    {s.roleEs}
                  </div>
                ) : null}
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {s.slug}
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {s.city ?? "—"}
              </div>
              <div className="text-right">
                <Link href={`/speakers/${s.id}/edit`}>
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
