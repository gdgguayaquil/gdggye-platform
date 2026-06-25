"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@gdggye/ui-kit";

import type { Event, EventDetail } from "@gdggye/backend-core";

import { useApp } from "../providers";
import { Countdown } from "../countdown";
import { FAQItem } from "../faq-item";
import { SectionHeader } from "../section-header";
import { COPY } from "@gdggye/i18n";
import { eventAccent } from "@/lib/event-presentation";

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

export function EventDetailView({
  event,
  detail,
  hideBackLink = false,
  isRegistered = false,
}: {
  event: Event;
  detail: EventDetail | null;
  hideBackLink?: boolean;
  isRegistered?: boolean;
}) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail;
  const [activeSection, setActiveSection] = React.useState<SectionId>("agenda");

  const accent = eventAccent(event);
  const accentVar = `var(--c-${accent})`;
  const accentSoft = `var(--c-${accent}-soft)`;
  const locale = lang === "es" ? "es-EC" : "en-US";

  const startAt = new Date(event.startAt);
  const endAt = new Date(event.endAt);
  const dateLong = startAt.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeRange = `${startAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}–${endAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

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
      {hideBackLink ? null : (
        <div className="container-x pt-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-wider text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
          >
            ← {t.back}
          </Link>
        </div>
      )}

      {/* HERO */}
      <section className="pb-12 pt-10">
        <div className="container-x">
          <div className="grid items-start gap-12 md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-6 flex flex-wrap gap-2">
                <span className={`chip chip-${accent}`}>
                  {prettifyType(event.type)}
                </span>
                <span className="chip chip-neutral">{event.year}</span>
                {event.leaderboardEnabled ? (
                  <span className="chip chip-neutral">
                    🏆 {lang === "es" ? "Leaderboard activo" : "Leaderboard on"}
                  </span>
                ) : null}
                {isRegistered ? (
                  <span className="chip chip-green">
                    ✓ {lang === "es" ? "Registrado" : "Registered"}
                  </span>
                ) : null}
              </div>

              <h1
                className="h-display mb-6"
                style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
              >
                {event.name}
                <span
                  className="mt-1 block font-medium"
                  style={{
                    color: accentVar,
                    fontSize: "0.55em",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {event.year}
                </span>
              </h1>

              {tagline ? (
                <p
                  className="mb-5 max-w-[560px] font-display text-[22px] font-medium leading-tight text-[var(--c-text)]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {tagline}
                </p>
              ) : null}

              {lede ? (
                <p className="mb-8 max-w-[580px] text-[17px] leading-relaxed text-[var(--c-text-muted)]">
                  {lede}
                </p>
              ) : null}

              <div className="mb-9 flex flex-wrap gap-3">
                <a href={event.ticketUrl ?? "#"}>
                  <Button variant="primary" size="lg">
                    {t.getTickets} →
                  </Button>
                </a>
                <Button variant="secondary" size="lg">
                  {t.addCalendar}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-[var(--c-border)] pt-7 sm:grid-cols-3">
                {[
                  {
                    l: lang === "es" ? "Fecha" : "Date",
                    v: dateLong,
                  },
                  {
                    l: lang === "es" ? "Hora" : "Time",
                    v: `${timeRange} · ${event.timezone ?? "GYE"}`,
                  },
                  {
                    l: lang === "es" ? "Lugar" : "Venue",
                    v: event.venueName ?? "",
                  },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="eyebrow mb-1.5">{m.l}</div>
                    <div className="text-sm font-medium">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Big date block + countdown */}
            <div
              className="relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[var(--r-xl)] p-8"
              style={{ background: accentSoft }}
            >
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `linear-gradient(${accentVar} 1px, transparent 1px), linear-gradient(90deg, ${accentVar} 1px, transparent 1px)`,
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative z-[2]">
                <div
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                  style={{ color: accentVar }}
                >
                  {startAt.toLocaleDateString(locale, {
                    weekday: "long",
                  })}
                </div>
                <div
                  className="mt-1 font-display font-semibold"
                  style={{
                    fontSize: "clamp(120px, 16vw, 220px)",
                    color: accentVar,
                    lineHeight: 0.85,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {startAt.getDate()}
                </div>
                <div
                  className="mt-1 font-display font-medium"
                  style={{
                    fontSize: 28,
                    color: accentVar,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {startAt.toLocaleDateString(locale, {
                    month: "long",
                  })}{" "}
                  {event.year}
                </div>
              </div>

              <div className="relative z-[2] mt-8">
                <div
                  className="eyebrow mb-3"
                  style={{ color: accentVar, opacity: 0.8 }}
                >
                  {lang === "es" ? "Faltan" : "Countdown"}
                </div>
                <Countdown target={startAt} />
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
          eyebrow="01 / Programa"
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
          eyebrow="02 / Ponentes"
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
          eyebrow="03 / Sponsors"
          title={t.sections.sponsors}
          sub={t.sponsorsSub}
          action={<Button variant="secondary">{t.becomeSponsor} →</Button>}
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
          eyebrow="04 / Sede"
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

            <Button variant="secondary">
              {lang === "es" ? "Cómo llegar" : "Get directions"} ↗
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
            <div className="eyebrow mb-3.5">05 / FAQ</div>
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
                href="mailto:hi@gdggye.org"
                className="font-mono text-[13px]"
                style={{ color: "var(--c-blue)" }}
              >
                hi@gdggye.org →
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
