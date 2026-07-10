"use client";

import Link from "next/link";

export type EventSubNavKey =
  | "details"
  | "sponsors"
  | "speakers"
  | "agenda"
  | "activities"
  | "attendees"
  | "scans"
  | "pre-checkin";

interface Tab {
  key: EventSubNavKey;
  label: string;
  href: (eventId: string) => string;
}

const TABS: Tab[] = [
  { key: "details", label: "Details", href: (id) => `/events/${id}/edit` },
  {
    key: "sponsors",
    label: "Sponsors",
    href: (id) => `/events/${id}/sponsors`,
  },
  {
    key: "speakers",
    label: "Speakers",
    href: (id) => `/events/${id}/speakers`,
  },
  {
    key: "agenda",
    label: "Agenda",
    href: (id) => `/events/${id}/agenda`,
  },
  {
    key: "activities",
    label: "Activities",
    href: (id) => `/events/${id}/activities`,
  },
  {
    key: "attendees",
    label: "Attendees",
    href: (id) => `/events/${id}/attendees`,
  },
  {
    key: "scans",
    label: "Scans",
    href: (id) => `/events/${id}/scans`,
  },
  {
    key: "pre-checkin",
    label: "Pre-checkin",
    href: (id) => `/events/${id}/pre-checkin`,
  },
];

// Event-scoped tab strip. Replaces the cluster of nav-style buttons that
// were piling up in page headers. QR sheet is a utility action and lives
// here too as a trailing link with an external-tab indicator.
export function EventSubNav({
  eventId,
  active,
}: {
  eventId: string;
  active: EventSubNavKey;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-1 border-b border-[var(--c-border)]">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href(eventId)}
            className="-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderColor: isActive ? "var(--c-text)" : "transparent",
              color: isActive ? "var(--c-text)" : "var(--c-text-muted)",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
      <span className="mx-2 h-4 w-px bg-[var(--c-border)]" aria-hidden />
      <a
        href={`/events/${eventId}/qr-sheet`}
        target="_blank"
        rel="noopener"
        className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-[var(--c-text-muted)] transition-colors hover:text-[var(--c-text)]"
      >
        QR sheet ↗
      </a>
    </div>
  );
}
