import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit on the last/current item
}

// Lightweight breadcrumb trail. Use at the top of every page so navigation
// up the hierarchy doesn't need its own button.
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-subtle)]"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span
            key={`${i}-${item.label}`}
            className="flex items-center gap-1.5"
          >
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[var(--c-text)]"
                style={{ color: "var(--c-text-muted)" }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: "var(--c-text)" }}>{item.label}</span>
            )}
            {!isLast ? <span aria-hidden>/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
