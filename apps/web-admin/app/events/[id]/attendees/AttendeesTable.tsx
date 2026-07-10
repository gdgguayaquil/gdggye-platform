"use client";

import Link from "next/link";
import * as React from "react";

import type { PreCheckinStatus } from "@gdggye/backend-core";

export interface AttendeeRow {
  userId: string;
  fullName: string;
  email: string;
  preCheckinStatus: PreCheckinStatus;
  totalPoints: number;
  rank: number;
  registeredAtLabel: string;
}

const COLS = "64px 1fr 140px 90px 110px";

const PRECHECKIN_CHIP: Record<PreCheckinStatus, string> = {
  approved: "chip-green",
  pending: "chip-yellow",
  rejected: "chip-red",
  not_submitted: "chip-neutral",
};

const PRECHECKIN_LABEL: Record<PreCheckinStatus, string> = {
  approved: "approved",
  pending: "pending",
  rejected: "rejected",
  not_submitted: "—",
};

export function AttendeesTable({
  eventId,
  rows,
  selectedUserId,
}: {
  eventId: string;
  rows: AttendeeRow[];
  selectedUserId: string | null;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          className="w-full max-w-xs rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
          aria-label="Search attendees"
        />
        <span className="whitespace-nowrap font-mono text-xs text-[var(--c-text-muted)]">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: COLS, minWidth: 620 }}
        >
          <div>Rank</div>
          <div>Attendee</div>
          <div>Pre-checkin</div>
          <div className="text-right">Points</div>
          <div>Registered</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            {rows.length === 0
              ? "No attendees registered yet."
              : "No attendees match that search."}
          </div>
        ) : (
          filtered.map((r) => {
            const isSelected = r.userId === selectedUserId;
            return (
              <Link
                key={r.userId}
                href={`/events/${eventId}/attendees?attendee=${r.userId}`}
                scroll={false}
                className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[var(--c-surface)]"
                style={{
                  gridTemplateColumns: COLS,
                  minWidth: 620,
                  background: isSelected
                    ? "color-mix(in srgb, var(--c-primary) 6%, transparent)"
                    : undefined,
                }}
              >
                <div className="font-mono text-sm text-[var(--c-text-muted)]">
                  #{r.rank}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">
                    {r.fullName || "—"}
                  </div>
                  <div className="truncate font-mono text-xs text-[var(--c-text-subtle)]">
                    {r.email || r.userId.slice(0, 8)}
                  </div>
                </div>
                <div>
                  <span
                    className={`chip ${PRECHECKIN_CHIP[r.preCheckinStatus]}`}
                  >
                    {PRECHECKIN_LABEL[r.preCheckinStatus]}
                  </span>
                </div>
                <div className="text-right font-mono text-sm tabular-nums">
                  {r.totalPoints}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {r.registeredAtLabel}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
