"use client";

import Link from "next/link";

import { Button, Input } from "@gdggye/ui-kit";

import { useApp } from "./providers";
import { Logo } from "./logo";
import { COPY, EVENTS } from "@/lib/data";

export function SiteFooter() {
  const { lang } = useApp();
  const t = COPY[lang].footer;
  const navT = COPY[lang].nav;

  return (
    <footer className="mt-20 border-t border-[var(--c-border)] bg-[var(--c-surface)] pb-8 pt-16">
      <div className="container-x">
        <div className="mb-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={24} />
            <p className="mt-4 max-w-[280px] text-sm text-[var(--c-text-muted)]">
              {t.tagline}
            </p>
            <div className="mt-5 flex gap-2">
              {["GH", "IG", "X", "YT", "IN"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-border)] font-mono text-[11px] text-[var(--c-text-muted)] transition-all hover:border-[var(--c-border-strong)] hover:text-[var(--c-text)]"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-3.5">{t.navTitle}</div>
            <ul className="grid gap-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  {navT.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  {navT.events}
                </Link>
              </li>
              <li>
                <Link
                  href="/#anchor-about"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  {navT.about}
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  {navT.community}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3.5">{t.eventsTitle}</div>
            <ul className="grid gap-2.5 text-sm">
              {EVENTS.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                  >
                    {e.name} {e.year}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3.5">{t.connectTitle}</div>
            <ul className="grid gap-2.5 text-sm">
              <li>
                <a
                  href="mailto:hi@gdggye.org"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  hi@gdggye.org
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  Code of conduct
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                >
                  Sponsor kit (PDF)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap items-center gap-6 rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-bg)] px-8 py-6">
          <div className="min-w-[280px] flex-1">
            <div className="font-display text-lg font-semibold">
              {t.newsletter}
            </div>
            <div className="mt-0.5 text-[13px] text-[var(--c-text-muted)]">
              {t.newsletterSub}
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex max-w-[480px] flex-1 gap-2"
            style={{ minWidth: "320px" }}
          >
            <Input
              type="email"
              placeholder={t.emailPlaceholder}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              {t.subscribe}
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--c-text-subtle)]">
          <span>{t.legal}</span>
          <span className="font-mono text-[11px]">v0.1 · Phase 1 preview</span>
        </div>
      </div>
    </footer>
  );
}
