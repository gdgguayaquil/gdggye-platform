"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { useApp } from "./providers";
import { Logo } from "./logo";
import { COPY } from "@gdggye/i18n";

export interface SiteHeaderUser {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
}

export function SiteHeader({ user }: { user: SiteHeaderUser | null }) {
  const { lang, setLang, theme, setTheme } = useApp();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const t = COPY[lang].nav;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const isEvents = pathname.startsWith("/events");

  const linkClass = (active: boolean) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-all ${
      active
        ? "bg-[var(--c-surface)] text-[var(--c-text)]"
        : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
    }`;

  return (
    <nav
      className="sticky top-0 z-50 h-[var(--nav-h)] transition-all"
      style={{
        background: scrolled
          ? "color-mix(in srgb, var(--c-bg) 88%, transparent)"
          : "var(--c-bg)",
        backdropFilter: scrolled ? "saturate(180%) blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(180%) blur(14px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--c-border)" : "transparent"}`,
      }}
    >
      <div className="container-x flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="Home" className="flex items-center">
          <Logo size={24} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link href="/" className={linkClass(isHome)}>
            {t.home}
          </Link>
          <Link href="/events" className={linkClass(isEvents)}>
            {t.events}
          </Link>
          <Link href="/#anchor-about" className={linkClass(false)}>
            {t.about}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-muted)] transition-all hover:text-[var(--c-text)]"
          >
            {theme === "light" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-0 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] p-[3px] font-mono text-[11px] font-medium">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className="rounded-full px-[11px] py-[5px] uppercase tracking-wider transition-all"
                style={{
                  background: lang === l ? "var(--c-bg)" : "transparent",
                  color: lang === l ? "var(--c-text)" : "var(--c-text-muted)",
                  boxShadow: lang === l ? "var(--shadow-xs)" : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {user ? (
            <>
              <Link
                href="/profile"
                className={linkClass(pathname.startsWith("/profile"))}
              >
                {firstName(user.fullName) || t.account}
              </Link>
              <form
                action="/auth/signout"
                method="post"
                className="flex items-center"
              >
                <Button type="submit" variant="secondary">
                  {t.signOut}
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="primary">
              <Link href="/sign-in">
                {t.signIn}
                <span className="text-xs opacity-70">↗</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}
