"use client";

import Link from "next/link";

import { Button, Countdown } from "@gdggye/ui-kit";
import type { Event } from "@gdggye/backend-core";

import { useApp } from "../providers";
import { EventCard } from "../event-card";
import { SectionHeader } from "../section-header";
import { COPY } from "@gdggye/i18n";
import {
  eventAccent,
  eventSummary,
  isUpcomingEvent,
  pickFeaturedEvent,
  shortVenue,
} from "@gdggye/event-presentation";

type Lang = keyof typeof COPY;

export function HomeView({ events }: { events: Event[] }) {
  const { lang } = useApp();
  const t = COPY[lang];
  const featured = pickFeaturedEvent(events);

  return (
    <div className="fade-in">
      {featured ? (
        <FeaturedHero event={featured} lang={lang} />
      ) : (
        <FallbackHero lang={lang} />
      )}

      <Ticker events={events} lang={lang} />

      {/* STATS STRIP */}
      <section className="border-b border-[var(--c-border)]">
        <div className="container-x">
          <div className="grid grid-cols-3">
            {[
              { n: "3,200+", l: t.hero.stat1 },
              { n: "24", l: t.hero.stat2 },
              { n: "9", l: t.hero.stat3 },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`py-6 md:py-9 ${i > 0 ? "border-l border-[var(--c-border)] pl-4 md:pl-8" : ""}`}
              >
                <div
                  className="font-display font-semibold leading-none"
                  style={{
                    fontSize: "clamp(26px, 5vw, 56px)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.n}
                </div>
                <div className="eyebrow mt-2.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS — badge wall */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow={t.upcoming.eyebrow}
            title={t.upcoming.title}
            sub={t.upcoming.sub}
            action={
              <Button asChild variant="ghost">
                <Link href="/events">{t.upcoming.viewAll} →</Link>
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        className="section"
        id="anchor-about"
        style={{ background: "var(--c-surface)" }}
      >
        <div className="container-x">
          <div className="grid items-start gap-16 md:grid-cols-[1fr_1.2fr]">
            <div className="md:sticky md:top-[100px]">
              <div className="eyebrow mb-4">{t.about.eyebrow}</div>
              <h2
                className="h-section"
                style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
              >
                {t.about.title}
              </h2>
              <p className="mt-6 max-w-[440px] text-[17px] leading-relaxed text-[var(--c-text-muted)]">
                {t.about.body}
              </p>

              <div className="mt-8 flex gap-6 font-mono text-xs text-[var(--c-text-subtle)]">
                <span>EST. 2017</span>
                <span>·</span>
                <span>2°10′S 79°54′W</span>
                <span>·</span>
                <span>UTC−5</span>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                { t: t.about.pillarTitle1, b: t.about.pillarBody1, c: "blue" },
                { t: t.about.pillarTitle2, b: t.about.pillarBody2, c: "green" },
                {
                  t: t.about.pillarTitle3,
                  b: t.about.pillarBody3,
                  c: "yellow",
                },
              ].map((p) => (
                <div
                  key={p.t}
                  className="grid items-start gap-5 rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-8 transition-all hover:border-[var(--c-border-strong)]"
                  style={{ gridTemplateColumns: "20px 1fr" }}
                >
                  <span
                    className="mt-2 inline-block h-3 w-3 rounded-full"
                    style={{ background: `var(--c-${p.c})` }}
                  />
                  <div>
                    <h3 className="m-0 font-display text-[22px] font-semibold tracking-tight">
                      {p.t}
                    </h3>
                    <p className="m-0 mt-2 text-[15px] text-[var(--c-text-muted)]">
                      {p.b}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JOIN BAND */}
      <section>
        <div aria-hidden="true" className="flex h-1.5">
          {(["blue", "red", "yellow", "green"] as const).map((c) => (
            <span
              key={c}
              className="flex-1"
              style={{ background: `var(--c-${c})` }}
            />
          ))}
        </div>
        <div className="container-x py-20 text-center md:py-24">
          <div className="eyebrow mb-4">{t.join.eyebrow}</div>
          <h2
            className="h-section mx-auto max-w-[20ch]"
            style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
          >
            {t.join.title}
          </h2>
          <p className="mx-auto mb-9 mt-5 max-w-[46ch] text-[17px] text-[var(--c-text-muted)]">
            {t.join.sub}
          </p>
          <Button asChild variant="primary" size="lg">
            <Link href="/sign-up">
              {t.join.button}
              <span>→</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// ── The next event IS the hero: a full-saturation panel in the event's
// accent color, with live countdown and the giant date.
function FeaturedHero({ event, lang }: { event: Event; lang: Lang }) {
  const t = COPY[lang];
  const locale = lang === "es" ? "es-EC" : "en-US";
  const accent = eventAccent(event);
  const startAt = new Date(event.startAt);
  const day = startAt.getDate();
  const monthShort = startAt
    .toLocaleDateString(locale, { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: event.timezone,
  });
  const summary = eventSummary(event, lang);
  const venueShort = shortVenue(event.venueName);
  const detailHref = `/events/${event.slug}`;
  // A countdown to a date that already passed is just a row of zeros.
  const upcoming = isUpcomingEvent(event);

  return (
    <header className="pt-5">
      <div className="container-x">
        <section
          className={`accent-panel-${accent} relative overflow-hidden rounded-[28px] px-6 py-11 sm:px-10 md:px-14 md:py-16`}
          aria-label={`${event.name} ${event.year}`}
        >
          {/* Faint stage grid, fading out from the top-right */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse at 75% 20%, black 20%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 75% 20%, black 20%, transparent 75%)",
            }}
          />

          <div className="relative grid gap-10 md:grid-cols-[1.25fr_0.75fr] md:items-end md:gap-12">
            <div>
              <div className="mb-7 inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.12em] opacity-90">
                <span className="dot dot-pulse panel-pop" />
                {t.hero.nextEvent}
              </div>

              <h1
                className="h-display mb-5"
                style={{
                  fontSize: "clamp(48px, 8.5vw, 110px)",
                  lineHeight: 0.95,
                }}
              >
                {event.name}{" "}
                <span className="panel-pop">
                  ’{String(event.year).slice(-2)}
                </span>
              </h1>

              {summary ? (
                <p
                  className="mb-9 max-w-[52ch] text-[17px] leading-[1.55] opacity-90"
                  style={{ textWrap: "pretty" as never }}
                >
                  {summary}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {event.ticketUrl ? (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="panel-btn panel-btn-solid"
                  >
                    {t.hero.reserve}
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <Link href={detailHref} className="panel-btn panel-btn-solid">
                    {t.hero.reserve}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
                <Link href={detailHref} className="panel-btn panel-btn-ghost">
                  {t.hero.agenda}
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-baseline gap-3.5 leading-none">
                <span
                  className="font-display font-semibold"
                  style={{
                    fontSize: "clamp(88px, 11vw, 148px)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {day}
                </span>
                <span className="panel-pop font-mono text-[15px] uppercase tracking-[0.18em]">
                  {monthShort}
                  <br />
                  {event.year}
                </span>
              </div>

              {upcoming ? (
                <Countdown
                  target={startAt}
                  labels={t.eventDetail.countdown}
                  variant="panel"
                />
              ) : null}

              <div className="font-mono text-[12.5px] uppercase tracking-[0.06em] opacity-80">
                {[
                  venueShort,
                  `${timeFmt.format(startAt)} — ${timeFmt.format(new Date(event.endAt))}`,
                  t.hero.free,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
        </section>
      </div>
    </header>
  );
}

// No published events (empty calendar between seasons): fall back to the
// community headline so the page never opens on an empty panel.
function FallbackHero({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <div className="container-x relative z-[2]">
        <div className="eyebrow mb-7 inline-flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: "var(--c-green)",
              boxShadow: "0 0 0 4px var(--c-green-soft)",
            }}
          />
          {t.hero.eyebrow}
        </div>
        <h1
          className="h-display mb-8 max-w-[1100px] whitespace-pre-line"
          style={{ fontSize: "clamp(40px, 7vw, 92px)" }}
        >
          {t.hero.title}
        </h1>
        <p className="mb-10 max-w-[580px] text-[19px] leading-[1.5] text-[var(--c-text-muted)]">
          {t.hero.sub}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/events">
              {t.hero.ctaPrimary}
              <span>→</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="#anchor-about">{t.hero.ctaSecondary}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Venue-signage marquee: upcoming dates + community facts on loop.
// Decorative (aria-hidden) — every fact it shows also lives elsewhere on
// the page. Two identical copies of the sequence make the -50% translate
// loop seamless; hover pauses, reduced-motion stops it entirely.
function Ticker({ events, lang }: { events: Event[]; lang: Lang }) {
  const t = COPY[lang];
  const locale = lang === "es" ? "es-EC" : "en-US";

  const items = [
    ...events.map((ev) => ({
      accent: eventAccent(ev),
      label: `${ev.name} — ${new Date(ev.startAt)
        .toLocaleDateString(locale, { day: "numeric", month: "short" })
        .replace(".", "")
        .toUpperCase()}`,
    })),
    { accent: "red" as const, label: t.ticker.devs },
    { accent: "blue" as const, label: t.ticker.free },
    { accent: "green" as const, label: t.ticker.years },
  ];
  // Pad short sequences so each copy is wider than any viewport.
  const seq = [...items, ...items];

  return (
    <div className="ticker mt-5" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="inline-flex items-center">
            {seq.map((it, i) => (
              <span key={`${copy}-${i}`} className="ticker-item">
                <span
                  className="ticker-dot"
                  style={{ background: `var(--c-${it.accent}-half)` }}
                />
                {it.label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
