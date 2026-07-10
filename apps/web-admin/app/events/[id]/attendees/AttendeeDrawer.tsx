"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import type {
  PointSource,
  PreCheckinStatus,
  ScanResult,
  ScanTargetType,
} from "@gdggye/backend-core";

export interface LedgerLine {
  id: string;
  source: PointSource;
  points: number;
  createdAtLabel: string;
}

export interface ScanLine {
  id: string;
  targetType: ScanTargetType;
  result: ScanResult;
  rejectReason: string | null;
  pointsGranted: number;
  scannedAtLabel: string;
}

export interface AttendeeDetail {
  userId: string;
  fullName: string;
  email: string;
  company: string | null;
  role: string | null;
  preCheckinStatus: PreCheckinStatus;
  totalPoints: number;
  eventRank: number | null;
  registeredAtLabel: string;
  reconciled: boolean;
  ledgerSum: number;
  ledger: LedgerLine[];
  scans: ScanLine[];
}

const SOURCE_CHIP: Record<PointSource, string> = {
  sponsor: "chip-blue",
  activity: "chip-green",
  networking: "chip-neutral",
  bonus: "chip-yellow",
  admin_adjustment: "chip-neutral",
};

const SOURCE_LABEL: Record<PointSource, string> = {
  sponsor: "sponsor",
  activity: "activity",
  networking: "networking",
  bonus: "bonus",
  admin_adjustment: "adjustment",
};

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function AttendeeDrawer({
  detail,
  closeHref,
}: {
  detail: AttendeeDetail;
  closeHref: string;
}) {
  const router = useRouter();

  // Escape closes the drawer by navigating back to the list URL — keeps the
  // open/closed state in the URL, so a refresh or shared link is consistent.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, closeHref]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <Link
        href={closeHref}
        scroll={false}
        aria-label="Close attendee details"
        className="absolute inset-0 bg-black/30"
      />
      <aside
        role="dialog"
        aria-label={`Attendee ${detail.fullName || detail.email}`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--c-border)] bg-[var(--c-bg)] shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--c-border)] px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold">
              {detail.fullName || "—"}
            </h2>
            <p className="truncate font-mono text-xs text-[var(--c-text-subtle)]">
              {detail.email || detail.userId}
            </p>
            {detail.role || detail.company ? (
              <p className="mt-1 truncate text-sm text-[var(--c-text-muted)]">
                {[detail.role, detail.company].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="rounded-[var(--r-md)] px-2 py-1 text-sm text-[var(--c-text-muted)] transition-colors hover:bg-[var(--c-surface)] hover:text-[var(--c-text)]"
            aria-label="Close"
          >
            ✕
          </Link>
        </header>

        <div className="grid grid-cols-3 gap-px border-b border-[var(--c-border)] bg-[var(--c-border)]">
          <Stat label="Points" value={String(detail.totalPoints)} />
          <Stat
            label="Rank"
            value={detail.eventRank !== null ? `#${detail.eventRank}` : "—"}
          />
          <Stat label="Pre-checkin" value={detail.preCheckinStatus} small />
        </div>

        {!detail.reconciled ? (
          <div
            className="border-b border-[var(--c-border)] px-6 py-3 text-xs"
            style={{
              color: "var(--c-red)",
              background: "color-mix(in srgb, var(--c-red) 8%, transparent)",
            }}
          >
            Ledger sum ({detail.ledgerSum}) doesn&rsquo;t match the stored total
            ({detail.totalPoints}). This is a data bug worth investigating.
          </div>
        ) : null}

        <Section title="Point ledger" count={detail.ledger.length}>
          {detail.ledger.length === 0 ? (
            <Empty>No points recorded yet.</Empty>
          ) : (
            detail.ledger.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`chip ${SOURCE_CHIP[line.source]}`}>
                    {SOURCE_LABEL[line.source]}
                  </span>
                  <span className="font-mono text-xs text-[var(--c-text-muted)]">
                    {line.createdAtLabel}
                  </span>
                </div>
                <span className="font-mono text-sm tabular-nums">
                  {signed(line.points)}
                </span>
              </div>
            ))
          )}
        </Section>

        <Section title="Scan history" count={detail.scans.length}>
          {detail.scans.length === 0 ? (
            <Empty>No scans yet.</Empty>
          ) : (
            detail.scans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`chip ${scan.result === "accepted" ? "chip-green" : "chip-red"}`}
                    >
                      {scan.result}
                    </span>
                    <span className="font-mono text-xs text-[var(--c-text-muted)]">
                      {scan.targetType}
                    </span>
                  </div>
                  {scan.rejectReason ? (
                    <div className="mt-1 font-mono text-[11px] text-[var(--c-text-subtle)]">
                      {scan.rejectReason}
                    </div>
                  ) : null}
                </div>
                <span className="font-mono text-sm tabular-nums text-[var(--c-text-muted)]">
                  {scan.result === "accepted"
                    ? signed(scan.pointsGranted)
                    : "—"}
                </span>
              </div>
            ))
          )}
        </Section>
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-[var(--c-bg)] px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--c-text-muted)]">
        {label}
      </div>
      <div
        className={`mt-1 font-display font-semibold ${small ? "text-sm" : "text-xl"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--c-border)]">
      <div className="flex items-center justify-between px-6 py-3">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]">
          {title}
        </h3>
        <span className="font-mono text-[11px] text-[var(--c-text-subtle)]">
          {count}
        </span>
      </div>
      <div className="divide-y divide-[var(--c-border)] border-t border-[var(--c-border)]">
        {children}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-6 text-center text-sm text-[var(--c-text-muted)]">
      {children}
    </div>
  );
}
