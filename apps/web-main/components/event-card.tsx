"use client";

import Link from "next/link";

import { useApp } from "./providers";
import { COPY } from "@/lib/data";
import type { EventSummary } from "@/lib/types";

interface EventCardProps {
  event: EventSummary;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const { lang } = useApp();
  const t = COPY[lang].upcoming;
  const locale = lang === "es" ? "es-EC" : "en-US";
  const start = event.start_at.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  const monthLong = event.start_at.toLocaleDateString(locale, {
    month: "long",
  });
  const day = event.start_at.getDate();
  const summary = lang === "es" ? event.summary_es : event.summary_en;

  const accentVar = `var(--c-${event.accent})`;
  const accentSoft = `var(--c-${event.accent}-soft)`;

  if (featured) {
    return (
      <Link
        href={`/events/${event.slug}`}
        className="block overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] transition-all hover:border-[var(--c-border-strong)] md:col-span-2"
      >
        <article className="grid min-h-[360px] md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-between p-10">
            <div>
              <div className="mb-5 flex gap-2">
                <span className={`chip chip-${event.accent}`}>
                  <span className="dot dot-pulse" /> Featured
                </span>
                <span className="chip chip-neutral">{event.year}</span>
              </div>
              <h3
                className="h-section mb-4"
                style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
              >
                {event.name}
                <span
                  className="block font-medium"
                  style={{ color: accentVar, fontSize: "0.7em" }}
                >
                  {event.year}
                </span>
              </h3>
              <p className="max-w-[440px] text-[16px] text-[var(--c-text-muted)]">
                {summary}
              </p>
            </div>

            <div className="mt-8 flex gap-8 text-[13px]">
              <div>
                <div className="eyebrow mb-1.5">
                  {lang === "es" ? "Fecha" : "Date"}
                </div>
                <div className="font-medium">{start}</div>
              </div>
              <div>
                <div className="eyebrow mb-1.5">
                  {lang === "es" ? "Sede" : "Venue"}
                </div>
                <div className="font-medium">{event.venue_short}</div>
              </div>
              <div>
                <div className="eyebrow mb-1.5">
                  {lang === "es" ? "Asistentes" : "Expected"}
                </div>
                <div className="font-medium">{event.expected}</div>
              </div>
            </div>
          </div>

          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{ background: accentSoft }}
          >
            <div className="relative z-[2] text-center">
              <div
                className="font-display font-semibold"
                style={{
                  fontSize: "clamp(120px, 14vw, 180px)",
                  color: accentVar,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                }}
              >
                {day}
              </div>
              <div
                className="mt-2 font-mono text-sm uppercase tracking-widest"
                style={{ color: accentVar }}
              >
                {monthLong} · {event.year}
              </div>
            </div>
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `linear-gradient(${accentVar} 1px, transparent 1px), linear-gradient(90deg, ${accentVar} 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`} className="block">
      <article className="flex h-full min-h-[280px] flex-col gap-5 rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-6 transition-all hover:border-[var(--c-border-strong)]">
        <div
          className="relative flex h-[140px] items-center justify-center overflow-hidden rounded-[var(--r-md)]"
          style={{ background: accentSoft }}
        >
          <div className="relative z-[2] text-center">
            <div
              className="font-display font-semibold"
              style={{
                fontSize: 64,
                color: accentVar,
                lineHeight: 0.9,
              }}
            >
              {day}
            </div>
            <div
              className="mt-1 font-mono text-[11px] uppercase tracking-widest"
              style={{ color: accentVar }}
            >
              {monthLong}
            </div>
          </div>
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(${accentVar} 1px, transparent 1px), linear-gradient(90deg, ${accentVar} 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 font-display text-[22px] font-semibold tracking-tight">
              {event.name}{" "}
              <span className="text-[var(--c-text-muted)]">{event.year}</span>
            </h3>
          </div>
          <p className="m-0 flex-1 text-sm text-[var(--c-text-muted)]">
            {summary}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--c-text-subtle)]">
            <span className="font-mono">{event.venue_short}</span>
            <span
              className="font-mono text-[11px] font-medium uppercase tracking-wider"
              style={{ color: accentVar }}
            >
              {t.details} →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
