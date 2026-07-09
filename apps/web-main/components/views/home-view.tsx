"use client";

import Link from "next/link";

import { Button } from "@gdggye/ui-kit";
import type { Event } from "@gdggye/backend-core";

import { useApp } from "../providers";
import { EventCard } from "../event-card";
import { SectionHeader } from "../section-header";
import { COPY } from "@gdggye/i18n";

export function HomeView({ events }: { events: Event[] }) {
  const { lang } = useApp();
  const t = COPY[lang];
  const featured = events[0];
  const others = events.slice(1);

  return (
    <div className="fade-in">
      {/* HERO */}
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

          <p
            className="mb-10 max-w-[580px] text-[19px] leading-[1.5] text-[var(--c-text-muted)]"
            style={{ textWrap: "pretty" as never }}
          >
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

        {/* Decorative dot grid */}
        <div
          className="pointer-events-none absolute top-[100px] hidden opacity-50 md:block"
          style={{
            right: "-100px",
            width: 600,
            height: 600,
            backgroundImage:
              "radial-gradient(circle, var(--c-border-strong) 1px, transparent 1.5px)",
            backgroundSize: "20px 20px",
            maskImage:
              "radial-gradient(circle at 30% 50%, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 30% 50%, black 30%, transparent 70%)",
          }}
        />
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-[var(--c-border)]">
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

      {/* UPCOMING EVENTS */}
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featured ? <EventCard event={featured} featured /> : null}
            {others.map((ev) => (
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
                {
                  n: "01",
                  t: t.about.pillarTitle1,
                  b: t.about.pillarBody1,
                  c: "blue",
                },
                {
                  n: "02",
                  t: t.about.pillarTitle2,
                  b: t.about.pillarBody2,
                  c: "green",
                },
                {
                  n: "03",
                  t: t.about.pillarTitle3,
                  b: t.about.pillarBody3,
                  c: "yellow",
                },
              ].map((p) => (
                <div
                  key={p.n}
                  className="grid items-start gap-6 rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] p-8 transition-all hover:border-[var(--c-border-strong)]"
                  style={{ gridTemplateColumns: "60px 1fr" }}
                >
                  <div
                    className="pt-1.5 font-mono text-[13px] font-medium"
                    style={{ color: `var(--c-${p.c})` }}
                  >
                    {p.n}
                  </div>
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
    </div>
  );
}
