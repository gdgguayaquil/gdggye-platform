"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@gdggye/ui-kit";

import { useApp } from "../providers";
import { COPY } from "@/lib/data";
import type { EventSummary, EventType } from "@/lib/types";

type Filter = "all" | EventType;

function prettifyType(type: EventType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EventsView({ events }: { events: EventSummary[] }) {
  const { lang } = useApp();
  const t = COPY[lang];
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.eventsPage.filterAll },
    { id: "build_with_ai", label: "Build with AI" },
    { id: "devfest", label: "DevFest" },
    { id: "google_io", label: "I/O Extended" },
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
              const accentVar = `var(--c-${ev.accent})`;
              const day = ev.start_at.getDate();
              const month = ev.start_at
                .toLocaleDateString(locale, { month: "short" })
                .toUpperCase();
              const dayOfWeek = ev.start_at.toLocaleDateString(locale, {
                weekday: "long",
              });
              const summary = lang === "es" ? ev.summary_es : ev.summary_en;

              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="block border-b border-[var(--c-border)] py-10 transition-colors hover:bg-[var(--c-surface)]"
                >
                  <div className="grid items-center gap-10 md:grid-cols-[120px_1fr_auto]">
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
                        <span className={`chip chip-${ev.accent}`}>
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
                        <span>📍 {ev.venue_short}</span>
                        <span>👥 {ev.expected}</span>
                      </div>
                    </div>

                    <Button variant="secondary">
                      {t.eventsPage.details} →
                    </Button>
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
