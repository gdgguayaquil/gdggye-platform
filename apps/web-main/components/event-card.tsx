"use client";

import Link from "next/link";

import type { Event } from "@gdggye/backend-core";

import { useApp } from "./providers";
import { COPY } from "@gdggye/i18n";
import {
  eventAccent,
  eventSummary,
  eventTypeLabel,
  shortVenue,
} from "@gdggye/event-presentation";

// Event card styled as an attendee credential: punch slot + saturated color
// band on top, tear-line above the RSVP row. Accent comes from the event
// type via eventAccent; the band/ink pairs live in globals.css
// (.accent-panel-*) so both themes stay legible.
export function EventCard({ event }: { event: Event }) {
  const { lang } = useApp();
  const t = COPY[lang].upcoming;
  const locale = lang === "es" ? "es-EC" : "en-US";
  const startAt = new Date(event.startAt);
  const day = startAt.getDate();
  const monthLong = startAt.toLocaleDateString(locale, { month: "long" });
  const summary = eventSummary(event, lang);
  const venueShort = shortVenue(event.venueName);
  const accent = eventAccent(event);

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] transition-all duration-200 group-hover:-translate-y-1.5 group-hover:-rotate-[0.5deg] group-hover:shadow-[0_20px_44px_rgba(0,0,0,0.14)]">
        <div
          className={`accent-panel-${accent} relative px-6 pb-6 pt-11 text-center`}
        >
          <span className="badge-slot" aria-hidden="true" />
          <div
            className="font-display font-semibold"
            style={{ fontSize: 84, lineHeight: 0.9, letterSpacing: "-0.04em" }}
          >
            {day}
          </div>
          <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] opacity-90">
            {monthLong} · {event.year}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-6">
          <span className={`chip chip-${accent} self-start`}>
            {eventTypeLabel(event.type)}
          </span>
          <h3 className="m-0 font-display text-[23px] font-semibold leading-[1.1] tracking-tight">
            {event.name} {event.year}
          </h3>
          <p className="m-0 flex-1 text-sm text-[var(--c-text-muted)]">
            {summary}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-dashed border-[var(--c-border-strong)] pt-3.5 font-mono text-xs text-[var(--c-text-subtle)]">
            <span>{venueShort}</span>
            <span
              className={`accent-ink-${accent} text-[11px] font-semibold uppercase tracking-wider`}
            >
              {t.reserve} →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
