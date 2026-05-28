"use client";

import * as React from "react";

import { useApp } from "./providers";
import { COPY } from "@/lib/data";

export function Countdown({ target }: { target: Date }) {
  const { lang } = useApp();
  const t = COPY[lang].eventDetail.countdown;
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now ? Math.max(0, target.getTime() - now.getTime()) : 0;
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
