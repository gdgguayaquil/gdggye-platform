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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const t = COPY[lang].nav;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigating closes the mobile menu.
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const isEvents = pathname.startsWith("/events");

  const linkClass = (active: boolean) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-all ${
      active
        ? "bg-[var(--c-surface)] text-[var(--c-text)]"
        : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block rounded-[var(--r-md)] px-4 py-3 text-[15px] font-medium transition-colors ${
      active
        ? "bg-[var(--c-surface)] text-[var(--c-text)]"
        : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface)] hover:text-[var(--c-text)]"
    }`;

  const themeToggle = (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-muted)] transition-all hover:border-[var(--c-border-strong)] hover:text-[var(--c-text)]"
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
  );

  const langSwitch = (
    <div className="flex shrink-0 items-center gap-0 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] p-[3px] font-mono text-[11px] font-medium">
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
  );

  return (
    <nav
      className="sticky top-0 z-50 h-[var(--nav-h)] transition-all"
      style={{
        background:
          scrolled || menuOpen
            ? "color-mix(in srgb, var(--c-bg) 88%, transparent)"
            : "var(--c-bg)",
        backdropFilter:
          scrolled || menuOpen ? "saturate(180%) blur(14px)" : "none",
        WebkitBackdropFilter:
          scrolled || menuOpen ? "saturate(180%) blur(14px)" : "none",
        borderBottom: `1px solid ${
          scrolled || menuOpen ? "var(--c-border)" : "transparent"
        }`,
      }}
    >
      <div className="container-x flex h-full items-center justify-between gap-3 md:gap-6">
        <Link href="/" aria-label="Home" className="flex shrink-0 items-center">
          <Logo size={24} />
        </Link>

        {/* Desktop nav */}
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
          {themeToggle}

          {/* Desktop-only controls — these live in the menu panel on mobile */}
          <div className="hidden items-center gap-2 md:flex">
            {langSwitch}
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

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] transition-all md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen ? (
        <div
          className="absolute inset-x-0 top-full border-b border-[var(--c-border)] md:hidden"
          style={{
            background: "color-mix(in srgb, var(--c-bg) 96%, transparent)",
            backdropFilter: "saturate(180%) blur(14px)",
            WebkitBackdropFilter: "saturate(180%) blur(14px)",
          }}
        >
          <div className="container-x flex flex-col gap-1 py-4">
            <Link href="/" className={mobileLinkClass(isHome)}>
              {t.home}
            </Link>
            <Link href="/events" className={mobileLinkClass(isEvents)}>
              {t.events}
            </Link>
            <Link
              href="/#anchor-about"
              className={mobileLinkClass(false)}
              onClick={() => setMenuOpen(false)}
            >
              {t.about}
            </Link>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--c-border)] pt-4">
              {langSwitch}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className={linkClass(pathname.startsWith("/profile"))}
                  >
                    {firstName(user.fullName) || t.account}
                  </Link>
                  <form action="/auth/signout" method="post">
                    <Button type="submit" variant="secondary">
                      {t.signOut}
                    </Button>
                  </form>
                </div>
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
        </div>
      ) : null}
    </nav>
  );
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}
