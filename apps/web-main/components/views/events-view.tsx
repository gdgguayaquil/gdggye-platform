"use client";

import * as React from "react";
import Link from "next/link";

import { buttonVariants } from "@gdggye/ui-kit";

import type { Event, EventType } from "@gdggye/backend-core";

import { useApp } from "../providers";
import { COPY } from "@gdggye/i18n";
import {
  eventAccent,
  eventSummary,
  shortVenue,
} from "@/lib/event-presentation";

type Filter = "all" | EventType;

const TYPE_LABELS: Record<EventType, string> = {
  build_with_ai: "Build with AI",
  devfest: "DevFest",
  google_io: "I/O Extended",
  meetup: "Meetup",
  tech_talk: "Tech Talk",
  conference: "Conference",
  workshop: "Workshop",
  hackathon: "Hackathon",
};

function prettifyType(type: EventType) {
  return TYPE_LABELS[type];
}

export function EventsView({ events }: { events: Event[] }) {
  const { lang } = useApp();
  const t = COPY[lang];
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  // Build filter pills from the types actually present in the data, so the row
  // stays tight as new event types (meetups, tech talks, …) appear.
  const presentTypes = React.useMemo(() => {
    const seen = new Set<EventType>();
    for (const e of events) seen.add(e.type);
    return Array.from(seen);
  }, [events]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.eventsPage.filterAll },
    ...presentTypes.map((type) => ({ id: type, label: TYPE_LABELS[type] })),
  ];

  const locale = lang === "es" ? "es-EC" : "en-US";

  return (
    <div className="fade-in">
      <section className="pb-10 pt-16">
        <div className="container-x">
          <div className="eyebrow mb-4">{t.upcoming.eyebrow}</div>
          <h1
            className="h-display mb-6"
            style={{ fontSize: "clamp(40px, 6vw, 76px)" }}
          >
            {t.eventsPage.title}
          </h1>
          <p className="max-w-[580px] text-[18px] text-[var(--c-text-muted)]">
            {t.eventsPage.sub}
          </p>

          <div className="mt-9 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="rounded-full border px-[18px] py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--c-text)" : "transparent",
                    color: active ? "var(--c-bg)" : "var(--c-text-muted)",
                    borderColor: active ? "var(--c-text)" : "var(--c-border)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-x">
          <div className="border-t border-[var(--c-border)]">
            {filtered.map((ev) => {
              const accent = eventAccent(ev);
              const accentVar = `var(--c-${accent})`;
              const startAt = new Date(ev.startAt);
              const day = startAt.getDate();
              const month = startAt
                .toLocaleDateString(locale, { month: "short" })
                .toUpperCase();
              const dayOfWeek = startAt.toLocaleDateString(locale, {
                weekday: "long",
              });
              const summary = eventSummary(ev, lang);
              const venueShort = shortVenue(ev.venueName);

              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="block border-b border-[var(--c-border)] py-8 transition-colors hover:bg-[var(--c-surface)] md:py-10"
                >
                  <div className="grid items-center gap-5 md:grid-cols-[120px_1fr_auto] md:gap-10">
                    <div>
                      <div
                        className="font-display font-semibold"
                        style={{
                          fontSize: 64,
                          color: accentVar,
                          lineHeight: 0.9,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {day}
                      </div>
                      <div className="mt-1 font-mono text-[11px] tracking-widest text-[var(--c-text-muted)]">
                        {month} {ev.year}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2.5">
                        <span className={`chip chip-${accent}`}>
                          {prettifyType(ev.type)}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]">
                          {dayOfWeek}
                        </span>
                      </div>
                      <h2
                        className="m-0 mb-1.5 font-display font-semibold"
                        style={{
                          fontSize: 32,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {ev.name} {ev.year}
                      </h2>
                      <p className="m-0 max-w-[600px] text-[15px] text-[var(--c-text-muted)]">
                        {summary}
                      </p>
                      <div className="mt-3 flex gap-4.5 text-[13px] text-[var(--c-text-subtle)]">
                        <span>📍 {venueShort}</span>
                        <span>👥 {ev.expectedAttendance}</span>
                      </div>
                    </div>

                    <span className="hidden md:block">
                      <span
                        className={buttonVariants({ variant: "secondary" })}
                      >
                        {t.eventsPage.details} →
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
