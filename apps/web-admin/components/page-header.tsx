import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

interface PageHeaderProps {
  crumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Title row used at the top of every admin page. Pattern:
//   breadcrumbs ↑
//   ┌────────────────────────────────────────────────────────┐
//   │  H1 + subtitle                       (single CTA)      │
//   └────────────────────────────────────────────────────────┘
//
// Secondary navigation (Sponsors / Activities / QR sheet) lives in
// EventSubNav, NOT in actions — keeps the primary action unambiguous.
export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-3xl">
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-2 text-[var(--c-text-muted)]">{subtitle}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
