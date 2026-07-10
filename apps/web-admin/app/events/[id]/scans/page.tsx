import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listScanLogs } from "@/lib/server/scans";

import { ScanRefresh } from "./ScanRefresh";

const COLS = "150px 1fr 110px 90px 120px";

export default async function ScansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const event = await findEventById(id);
  if (!event) notFound();

  const { rows, summary } = await listScanLogs(id);

  const timeLabel = (d: Date) =>
    d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: event.timezone,
    });

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Scans" },
        ]}
        title="Scans"
        subtitle="Live scan activity for this event."
      />
      <EventSubNav eventId={id} active="scans" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Metric label="Accepted" value={summary.accepted} tone="green" />
          <Metric label="Rejected" value={summary.rejected} tone="red" />
        </div>
        <ScanRefresh />
      </div>

      {summary.rejectReasons.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]">
            Rejections
          </span>
          {summary.rejectReasons.map((r) => (
            <span key={r.reason} className="chip chip-red">
              {r.reason} · {r.count}
            </span>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: COLS, minWidth: 620 }}
        >
          <div>Result</div>
          <div>Scanner</div>
          <div>Target</div>
          <div className="text-right">Points</div>
          <div>Time</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No scans recorded yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid items-start gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
              style={{ gridTemplateColumns: COLS, minWidth: 620 }}
            >
              <div>
                <span
                  className={`chip ${r.result === "accepted" ? "chip-green" : "chip-red"}`}
                >
                  {r.result}
                </span>
                {r.rejectReason ? (
                  <div className="mt-1 font-mono text-[11px] text-[var(--c-text-subtle)]">
                    {r.rejectReason}
                  </div>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display font-semibold">
                  {r.scannerName || "—"}
                </div>
                <div className="truncate font-mono text-xs text-[var(--c-text-subtle)]">
                  {r.scannerEmail || r.scannerUserId.slice(0, 8)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm">{r.targetType}</div>
                <div className="truncate font-mono text-[11px] text-[var(--c-text-subtle)]">
                  {r.targetId.slice(0, 8)}
                </div>
              </div>
              <div className="text-right font-mono text-sm tabular-nums">
                {r.result === "accepted" ? `+${r.pointsGranted}` : "—"}
              </div>
              <div className="font-mono text-xs text-[var(--c-text-muted)]">
                {timeLabel(r.scannedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red";
}) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--c-border)] px-5 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--c-text-muted)]">
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl font-semibold tabular-nums"
        style={{ color: tone === "green" ? "var(--c-green)" : "var(--c-red)" }}
      >
        {value}
      </div>
    </div>
  );
}
