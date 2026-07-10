"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { COPY } from "@gdggye/i18n";

import { useApp } from "./providers";

type NavStrings = (typeof COPY)["es"]["nav"] | (typeof COPY)["en"]["nav"];

interface Item {
  href: string;
  match: (path: string) => boolean;
  label: (t: NavStrings) => string;
  icon: React.ReactNode;
}

const ITEMS: Item[] = [
  {
    href: "/",
    match: (p) => p === "/",
    label: (t) => t.home,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-8 9 8M5 10v10h14V10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/scanner",
    match: (p) => p.startsWith("/scanner"),
    label: (t) => t.scanner,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7V5a1 1 0 011-1h2M20 7V5a1 1 0 00-1-1h-2M4 17v2a1 1 0 001 1h2M20 17v2a1 1 0 01-1 1h-2M3 12h18"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    match: (p) => p.startsWith("/leaderboard"),
    label: (t) => t.leaderboard,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 21V10M12 21V4M20 21v-7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/my-qr",
    match: (p) => p.startsWith("/my-qr"),
    label: (t) => t.myQr,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    href: "/my-badges",
    match: (p) => p.startsWith("/my-badges"),
    label: (t) => t.badges,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    match: (p) => p.startsWith("/profile"),
    label: (t) => t.profile,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4 21c0-4 4-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { lang } = useApp();
  const pathname = usePathname();
  const t = COPY[lang].nav;

  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-bg)]"
      style={{
        background: "color-mix(in srgb, var(--c-bg) 92%, transparent)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
      }}
      aria-label="App nav"
    >
      <div className="container-x grid grid-cols-6 gap-1 py-2">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium tracking-wider transition-colors"
              style={{
                color: active ? "var(--c-primary)" : "var(--c-text-muted)",
              }}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              <span className="uppercase">{item.label(t)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
