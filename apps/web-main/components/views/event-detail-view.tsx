"use client";

import * as React from "react";
import Link from "next/link";

import { Button, Countdown } from "@gdggye/ui-kit";

import type { Event, EventDetail } from "@gdggye/backend-core";

import { useApp } from "../providers";
import { FAQItem } from "../faq-item";
import { SectionHeader } from "../section-header";
import { COPY } from "@gdggye/i18n";
import { eventAccent, isUpcomingEvent } from "@gdggye/event-presentation";

// Translucent pill for status tags shown ON an accent panel, where the
// soft-fill `.chip-*` classes would be illegible. Uses currentColor so it
// stays correct whatever the panel accent is.
function PanelPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider"
      style={{
        background: "color-mix(in srgb, currentColor 14%, transparent)",
      }}
    >
      {children}
    </span>
  );
}

const TRACK_COLORS: Record<string, string> = {
  Plenaria: "blue",
  "AI Engineering": "green",
  "Hands-on": "yellow",
};

const SECTIONS = ["agenda", "speakers", "sponsors", "venue", "faq"] as const;
type SectionId = (typeof SECTIONS)[number];

function prettifyType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a date as the compact UTC stamp Google Calendar expects. */
function gcalDate(value: Date | string) {
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

export function EventDetailView({
  event,
  detail,
}: {
  event: Event;
  detail: EventDetail | null;
}) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;
  const [activeSection, setActiveSection] = React.useState<SectionId>("agenda");

  const accent = eventAccent(event);
  const locale = lang === "es" ? "es-EC" : "en-US";

  const startAt = new Date(event.startAt);
  const endAt = new Date(event.endAt);
  const day = startAt.getDate();
  const monthShort = startAt
    .toLocaleDateString(locale, { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const weekdayLong = startAt.toLocaleDateString(locale, { weekday: "long" });
  const timeRange = `${startAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}–${endAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const upcoming = isUpcomingEvent(event);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace("anchor-", "") as SectionId;
            setActiveSection(id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`anchor-${s}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const tagline = detail
    ? lang === "es"
      ? detail.content.hero.tagline_es
      : detail.content.hero.tagline_en
    : null;
  const lede = detail
    ? lang === "es"
      ? detail.content.hero.lede_es
      : detail.content.hero.lede_en
    : null;

  return (
    <div className="fade-in">
      {/* Back nav */}
      <div className="container-x pt-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-wider text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
        >
          ← {t.back}
        </Link>
      </div>

      {/* HERO — accent panel (the event's own color as the stage screen) */}
      <section className="pb-12 pt-4">
        <div className="container-x">
          <div
            className={`accent-panel-${accent} relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 md:px-14 md:py-14`}
          >
            {/* Faint stage grid, fading out from the top-right */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage:
                  "radial-gradient(ellipse at 78% 15%, black 20%, transparent 72%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at 78% 15%, black 20%, transparent 72%)",
              }}
            />

            <div className="relative grid gap-10 md:grid-cols-[1.35fr_1fr] md:items-end md:gap-12">
              <div>
                <div className="mb-6 flex flex-wrap gap-2">
                  <PanelPill>{prettifyType(event.type)}</PanelPill>
                  {event.leaderboardEnabled ? (
                    <PanelPill>
                      🏆{" "}
                      {lang === "es" ? "Leaderboard activo" : "Leaderboard on"}
                    </PanelPill>
                  ) : null}
                </div>

                <h1
                  className="h-display mb-5"
                  style={{
                    fontSize: "clamp(44px, 8vw, 104px)",
                    lineHeight: 0.95,
                  }}
                >
                  {event.name}{" "}
                  <span className="panel-pop">
                    ’{String(event.year).slice(-2)}
                  </span>
                </h1>

                {tagline ? (
                  <p
                    className="mb-4 max-w-[540px] font-display text-[22px] font-medium leading-tight"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {tagline}
                  </p>
                ) : null}

                {lede ? (
                  <p className="mb-8 max-w-[560px] text-[16px] leading-relaxed opacity-90">
                    {lede}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <a
                    href={event.ticketUrl ?? "#"}
                    className="panel-btn panel-btn-solid"
                  >
                    {t.getTickets} <span aria-hidden="true">→</span>
                  </a>
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      `${event.name} ${event.year}`,
                    )}&dates=${gcalDate(event.startAt)}/${gcalDate(
                      event.endAt,
                    )}&location=${encodeURIComponent(event.venueName ?? "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="panel-btn panel-btn-ghost"
                  >
                    {t.addCalendar}
                  </a>
                </div>
              </div>

              {/* Giant date, countdown, venue/time facts */}
              <div className="flex flex-col gap-6">
                <div className="flex items-baseline gap-3.5 leading-none">
                  <span
                    className="font-display font-semibold"
                    style={{
                      fontSize: "clamp(96px, 12vw, 160px)",
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
                  <div>
                    <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                      {lang === "es" ? "Faltan" : "Countdown"}
                    </div>
                    <Countdown
                      target={startAt}
                      labels={t.countdown}
                      variant="panel"
                    />
                  </div>
                ) : null}

                <div
                  className="grid gap-2.5 border-t pt-5 font-mono text-[12.5px] uppercase tracking-[0.05em]"
                  style={{
                    borderColor:
                      "color-mix(in srgb, currentColor 22%, transparent)",
                  }}
                >
                  <div className="flex justify-between gap-4">
                    <span className="opacity-70">
                      {lang === "es" ? "Día" : "Day"}
                    </span>
                    <span className="text-right">{weekdayLong}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="opacity-70">
                      {lang === "es" ? "Hora" : "Time"}
                    </span>
                    <span className="text-right">
                      {timeRange} · {event.timezone ?? "GYE"}
                    </span>
                  </div>
                  {event.venueName ? (
                    <div className="flex justify-between gap-4">
                      <span className="opacity-70">
                        {lang === "es" ? "Lugar" : "Venue"}
                      </span>
                      <span className="text-right">{event.venueName}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IN-PAGE NAV */}
      <div
        className="sticky z-40 border-y border-[var(--c-border)]"
        style={{
          top: "var(--nav-h)",
          background: "color-mix(in srgb, var(--c-bg) 92%, transparent)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
        }}
      >
        <div className="container-x flex gap-1 overflow-x-auto py-3">
          {SECTIONS.map((s) => (
            <a
              key={s}
              href={`#anchor-${s}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(`anchor-${s}`);
                if (el) {
                  const y =
                    el.getBoundingClientRect().top + window.scrollY - 130;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-all"
              style={{
                color:
                  activeSection === s ? "var(--c-text)" : "var(--c-text-muted)",
                background:
                  activeSection === s ? "var(--c-surface)" : "transparent",
              }}
            >
              {t.sections[s]}
            </a>
          ))}
        </div>
      </div>

      {detail ? (
        <>
          <AgendaSection detail={detail} event={event} />
          <SpeakersSection detail={detail} />
          <SponsorsSection detail={detail} />
          <VenueSection event={event} />
          <FAQSection detail={detail} />
        </>
      ) : (
        <section className="section">
          <div className="container-x">
            <p className="text-[var(--c-text-muted)]">
              {lang === "es"
                ? "Detalles próximamente."
                : "Details coming soon."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function AgendaSection({
  detail,
  event,
}: {
  detail: EventDetail;
  event: Event;
}) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;

  if (detail.agenda.length === 0) return null;

  const timeFmt = new Intl.DateTimeFormat(lang === "es" ? "es-EC" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: event.timezone,
  });

  return (
    <section className="section" id="anchor-agenda">
      <div className="container-x">
        <SectionHeader
          eyebrow="Programa"
          title={t.sections.agenda}
          sub={t.agendaSub}
        />

        <div className="mb-8 flex flex-wrap gap-4">
          {Object.entries(TRACK_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 text-[13px]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `var(--c-${color})` }}
              />
              <span className="font-medium">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-[13px] text-[var(--c-text-muted)]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--c-text-subtle)" }}
            />
            <span>{lang === "es" ? "General" : "General"}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)]">
          {detail.agenda.map((slot, i) => {
            const trackColor = slot.track ? TRACK_COLORS[slot.track] : null;
            const trackVar = trackColor
              ? `var(--c-${trackColor})`
              : "var(--c-text-subtle)";
            const title = lang === "es" ? slot.titleEs : slot.titleEn;

            return (
              <div
                key={slot.id}
                className="grid items-center gap-6 px-7 py-5 transition-colors hover:bg-[var(--c-surface)]"
                style={{
                  gridTemplateColumns: "90px 4px 1fr auto",
                  borderTop: i > 0 ? "1px solid var(--c-border)" : "none",
                }}
              >
                <div>
                  <div
                    className="font-mono font-medium"
                    style={{
                      fontSize: 16,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {timeFmt.format(slot.startAt)}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--c-text-subtle)]">
                    {slot.durationMinutes} min
                  </div>
                </div>

                <div
                  className="self-stretch rounded"
                  style={{ width: 4, background: trackVar }}
                />

                <div>
                  <div
                    className="mb-1 font-display font-medium"
                    style={{ fontSize: 18, letterSpacing: "-0.01em" }}
                  >
                    {title}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--c-text-muted)]">
                    {slot.track ? <span>{slot.track}</span> : null}
                    {slot.speakers.length > 0 ? (
                      <>
                        {slot.track ? <span>·</span> : null}
                        <div className="flex flex-wrap items-center gap-3">
                          {slot.speakers.map((sp) => (
                            <span
                              key={sp.speakerId}
                              className="inline-flex items-center gap-1.5"
                            >
                              <span
                                className="inline-block overflow-hidden rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] align-middle"
                                style={{ width: 20, height: 20 }}
                              >
                                {sp.photoUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={sp.photoUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </span>
                              <span className="font-medium text-[var(--c-text)]">
                                {sp.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="font-mono text-xs uppercase tracking-wider text-[var(--c-text-subtle)]">
                  {slot.room}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SpeakersSection({ detail }: { detail: EventDetail }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;

  if (detail.speakers.length === 0) return null;

  return (
    <section
      className="section"
      id="anchor-speakers"
      style={{ background: "var(--c-surface)" }}
    >
      <div className="container-x">
        <SectionHeader
          eyebrow="Ponentes"
          title={t.sections.speakers}
          sub={t.speakersSub}
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {detail.speakers.map((row) => {
            const sp = row.speaker;
            const role = lang === "es" ? sp.roleEs : sp.roleEn;
            return (
              <div
                key={row.attachmentId}
                className="cursor-pointer rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-5 transition-all hover:border-[var(--c-border-strong)]"
              >
                <div
                  className="mb-4 overflow-hidden rounded-[var(--r-md)] bg-[var(--c-surface)]"
                  style={{ aspectRatio: "1" }}
                >
                  {sp.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sp.photoUrl}
                      alt={sp.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="placeholder h-full w-full">
                      <span>{sp.name.slice(0, 1)}</span>
                    </div>
                  )}
                </div>
                <h3 className="m-0 font-display text-[18px] font-semibold tracking-tight">
                  {sp.name}
                  {row.isHeadliner ? (
                    <span
                      className="ml-2 align-middle font-mono text-[10px] uppercase tracking-wider"
                      style={{ color: "var(--c-blue)" }}
                    >
                      ★ keynote
                    </span>
                  ) : null}
                </h3>
                {role ? (
                  <div className="mt-1 text-[13px] text-[var(--c-text-muted)]">
                    {role}
                  </div>
                ) : null}
                {sp.city ? (
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]">
                    📍 {sp.city}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SponsorsSection({ detail }: { detail: EventDetail }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;

  const tiers: Array<{
    id: "platinum" | "gold" | "silver" | "community";
    height: number;
    cols: number;
    fontSize: number;
  }> = [
    { id: "platinum", height: 120, cols: 2, fontSize: 22 },
    { id: "gold", height: 90, cols: 3, fontSize: 18 },
    { id: "silver", height: 70, cols: 4, fontSize: 15 },
    { id: "community", height: 56, cols: 6, fontSize: 15 },
  ];

  const totalSponsors =
    detail.sponsorTiers.platinum.length +
    detail.sponsorTiers.gold.length +
    detail.sponsorTiers.silver.length +
    detail.sponsorTiers.community.length +
    detail.sponsorTiers.other.length;
  if (totalSponsors === 0) return null;

  return (
    <section className="section" id="anchor-sponsors">
      <div className="container-x">
        <SectionHeader
          eyebrow="Sponsors"
          title={t.sections.sponsors}
          sub={t.sponsorsSub}
          action={
            <Button asChild variant="secondary">
              <a href="mailto:info@gdggye.org?subject=Sponsorship">
                {t.becomeSponsor} →
              </a>
            </Button>
          }
        />

        <div className="grid gap-8">
          {tiers.map((tier) => {
            const sponsors = detail.sponsorTiers[tier.id] ?? [];
            if (sponsors.length === 0) return null;
            const tierLabel = t.sponsorsTier[tier.id];

            return (
              <div key={tier.id}>
                <div className="mb-4 flex items-baseline gap-3 border-b border-[var(--c-border)] pb-3">
                  <div
                    className="font-display font-semibold"
                    style={{ fontSize: 22, letterSpacing: "-0.01em" }}
                  >
                    {tierLabel}
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]">
                    {sponsors.length} {lang === "es" ? "partners" : "partners"}
                  </div>
                </div>

                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${tier.cols}, minmax(0, 1fr))`,
                  }}
                >
                  {sponsors.map((row) => {
                    const sp = row.sponsor;
                    return (
                      <div
                        key={row.attachmentId}
                        className="flex cursor-pointer items-center justify-center rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--c-border-strong)] hover:shadow-[var(--shadow-sm)]"
                        style={{ height: tier.height }}
                      >
                        {sp.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sp.logoUrl}
                            alt={sp.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span
                            className="font-display font-medium"
                            style={{
                              fontSize: tier.fontSize,
                              color: "var(--c-text-muted)",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {sp.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VenueSection({ event }: { event: Event }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;
  const accent = eventAccent(event);
  const accentVar = `var(--c-${accent})`;

  const facts = [
    {
      l: lang === "es" ? "Capacidad" : "Capacity",
      v: "600 + 4 salas",
    },
    {
      l: lang === "es" ? "Accesibilidad" : "Access",
      v:
        lang === "es"
          ? "Rampa, ascensor, baños accesibles"
          : "Ramp, elevator, accessible restrooms",
    },
    {
      l: lang === "es" ? "Transporte" : "Transit",
      v:
        lang === "es"
          ? "Metrovía a 400m · estacionamiento gratuito"
          : "Metrovía 400m · free parking",
    },
    {
      l: "Wi-Fi",
      v:
        lang === "es"
          ? "Pública y red de speakers"
          : "Public + speakers network",
    },
  ];

  return (
    <section
      className="section"
      id="anchor-venue"
      style={{ background: "var(--c-surface)" }}
    >
      <div className="container-x">
        <SectionHeader
          eyebrow="Sede"
          title={t.sections.venue}
          sub={t.venueSub}
        />

        <div className="grid items-start gap-8 md:grid-cols-[1fr_1.5fr]">
          <div>
            <div
              className="mb-2 font-display font-semibold"
              style={{ fontSize: 28, letterSpacing: "-0.02em" }}
            >
              {event.venueName}
            </div>
            <div className="mb-6 text-[var(--c-text-muted)]">
              {event.venueAddress}
            </div>

            <div className="mb-7 grid gap-4">
              {facts.map((m) => (
                <div
                  key={m.l}
                  className="grid gap-4 border-b border-[var(--c-border)] pb-4"
                  style={{ gridTemplateColumns: "120px 1fr" }}
                >
                  <div className="eyebrow pt-0.5">{m.l}</div>
                  <div className="text-sm font-medium">{m.v}</div>
                </div>
              ))}
            </div>

            <Button asChild variant="secondary">
              <a
                href={
                  event.venueMapUrl ??
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    event.venueAddress ?? event.venueName ?? "",
                  )}`
                }
                target="_blank"
                rel="noreferrer"
              >
                {lang === "es" ? "Cómo llegar" : "Get directions"} ↗
              </a>
            </Button>
          </div>

          {/* Stylized map placeholder */}
          <div
            className="relative overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)]"
            style={{ aspectRatio: "16 / 11" }}
          >
            <svg
              viewBox="0 0 800 550"
              width="100%"
              height="100%"
              style={{ display: "block" }}
            >
              <defs>
                <pattern
                  id="mapgrid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="var(--c-border)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="800" height="550" fill="var(--c-surface)" />
              <rect width="800" height="550" fill="url(#mapgrid)" />

              <path
                d="M 0 200 Q 200 180, 400 240 T 800 220"
                stroke="var(--c-border-strong)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M 0 380 L 800 360"
                stroke="var(--c-border-strong)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 250 0 L 280 550"
                stroke="var(--c-border-strong)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 580 0 L 600 550"
                stroke="var(--c-border-strong)"
                strokeWidth="2"
                fill="none"
              />

              <path
                d="M 700 0 Q 720 200, 680 350 T 800 550"
                stroke={accentVar}
                strokeWidth="6"
                fill="none"
                opacity="0.18"
              />

              <g transform="translate(400, 270)">
                <circle r="56" fill={accentVar} opacity="0.10" />
                <circle r="32" fill={accentVar} opacity="0.18" />
                <circle r="14" fill={accentVar} />
                <circle r="5" fill="white" />
              </g>

              <text
                x="430"
                y="265"
                fontFamily="var(--font-jetbrains-mono), monospace"
                fontSize="13"
                fill="var(--c-text)"
                fontWeight="500"
              >
                {event.venueName ?? ""}
              </text>
              <text
                x="430"
                y="285"
                fontFamily="var(--font-jetbrains-mono), monospace"
                fontSize="11"
                fill="var(--c-text-muted)"
              >
                2°08′S 79°57′W
              </text>
            </svg>

            <div className="absolute left-4 top-4 rounded-[var(--r-sm)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]">
              map · placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection({ detail }: { detail: EventDetail }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;

  return (
    <section className="section" id="anchor-faq">
      <div className="container-x">
        <div className="grid items-start gap-12 md:grid-cols-[1fr_1.6fr]">
          <div className="md:sticky md:top-[130px]">
            <div className="eyebrow mb-3.5">FAQ</div>
            <h2
              className="h-section"
              style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
            >
              {t.sections.faq}
            </h2>
            <p className="mt-4 text-[17px] text-[var(--c-text-muted)]">
              {t.faqSub}
            </p>
            <div className="mt-7 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5">
              <div className="mb-1 text-[13px] font-medium">
                {lang === "es"
                  ? "¿No encuentras tu pregunta?"
                  : "Question not listed?"}
              </div>
              <div className="mb-3 text-[13px] text-[var(--c-text-muted)]">
                {lang === "es"
                  ? "Escríbenos y respondemos en menos de 24h."
                  : "Email us — we reply within 24h."}
              </div>
              <a
                href="mailto:info@gdggye.org"
                className="font-mono text-[13px]"
                style={{ color: "var(--c-blue)" }}
              >
                info@gdggye.org →
              </a>
            </div>
          </div>

          <div className="border-b border-[var(--c-border)]">
            {detail.content.faq.map((f, i) => (
              <FAQItem
                key={i}
                q={lang === "es" ? f.q_es : f.q_en}
                a={lang === "es" ? f.a_es : f.a_en}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
