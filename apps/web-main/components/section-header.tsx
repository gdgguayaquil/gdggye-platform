import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  sub,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-[640px]">
        {eyebrow ? <div className="eyebrow mb-3">{eyebrow}</div> : null}
        <h2
          className="h-section"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          {title}
        </h2>
        {sub ? (
          <p className="mt-3 max-w-[560px] text-[17px] text-[var(--c-text-muted)]">
            {sub}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
