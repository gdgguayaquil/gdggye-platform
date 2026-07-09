"use client";

import * as React from "react";

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

export interface CountdownLabels {
  d: string;
  h: string;
  m: string;
  s: string;
}

// Presentational live countdown. i18n stays in the app: pass the localized
// unit labels rather than reading an app-specific context, so this can live
// in the shared kit. `variant="panel"` renders translucent currentColor
// cells for use on an accent panel, where theme bg/border would vanish.
export function Countdown({
  target,
  labels,
  variant = "default",
}: {
  target: Date;
  labels: CountdownLabels;
  variant?: "default" | "panel";
}) {
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

  const onPanel = variant === "panel";

  const cell = (val: number, label: string) => (
    <div
      className={
        onPanel
          ? "min-w-0 flex-1 rounded-[var(--r-md)] border px-2 py-3 text-center"
          : "min-w-[70px] flex-1 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-3.5 text-center"
      }
      style={
        onPanel
          ? {
              background: "color-mix(in srgb, currentColor 12%, transparent)",
              borderColor: "color-mix(in srgb, currentColor 28%, transparent)",
            }
          : undefined
      }
    >
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
      <div
        className={
          onPanel
            ? "mt-1.5 font-mono text-[10px] uppercase tracking-widest opacity-70"
            : "mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--c-text-muted)]"
        }
      >
        {label}
      </div>
    </div>
  );

  return (
    <div className={onPanel ? "flex gap-2.5" : "flex max-w-[420px] gap-2"}>
      {cell(d, labels.d)}
      {cell(h, labels.h)}
      {cell(m, labels.m)}
      {cell(s, labels.s)}
    </div>
  );
}
