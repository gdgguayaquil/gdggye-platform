"use client";

import * as React from "react";

interface FAQItemProps {
  q: string;
  a: string;
  defaultOpen?: boolean;
}

export function FAQItem({ q, a, defaultOpen = false }: FAQItemProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-t border-[var(--c-border)]">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="font-display text-lg font-medium tracking-tight text-[var(--c-text)]">
          {q}
        </span>
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-text-muted)] transition-transform"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0)",
            transitionDuration: "240ms",
            transitionTimingFunction: "cubic-bezier(.4,.2,.2,1)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1V13M1 7H13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows]"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          transitionDuration: "280ms",
          transitionTimingFunction: "cubic-bezier(.4,.2,.2,1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="pb-6 pr-14 text-base leading-relaxed text-[var(--c-text-muted)]">
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}
