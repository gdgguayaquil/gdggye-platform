"use client";

import * as React from "react";

import { useApp } from "./providers";
import { COPY } from "@gdggye/i18n";

// Sentinel for the server snapshot. SSR/hydration render "00 00 00 00";
// once mounted, useSyncExternalStore re-renders with Date.now().
const SERVER_SNAPSHOT = 0;

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Date.now();
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function Countdown({ target }: { target: Date }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail.countdown;
  const now = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const diff =
    now === SERVER_SNAPSHOT ? 0 : Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const cell = (val: number, label: string) => (
    <div className="min-w-[70px] flex-1 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-3.5 text-center">
      <div
        className="font-display font-semibold leading-none"
        style={{
          fontSize: 28,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(val).padStart(2, "0")}
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--c-text-muted)]">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex max-w-[420px] gap-2">
      {cell(d, t.d)}
      {cell(h, t.h)}
      {cell(m, t.m)}
      {cell(s, t.s)}
    </div>
  );
}
