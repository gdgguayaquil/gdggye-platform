"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

interface AdminHeaderUser {
  fullName: string;
  email: string;
  systemRole: "attendee" | "organizer" | "admin";
}

export function AdminHeader({ user }: { user: AdminHeaderUser | null }) {
  const pathname = usePathname();
  const link = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className="rounded-full px-3 py-2 text-sm font-medium transition-colors"
        style={{
          color: active ? "var(--c-text)" : "var(--c-text-muted)",
          background: active ? "var(--c-surface)" : "transparent",
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--c-border)]"
      style={{
        background: "color-mix(in srgb, var(--c-bg) 92%, transparent)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
      }}
    >
      <div className="container-x flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="font-display text-base font-semibold tracking-tight"
            style={{ color: "var(--c-text)" }}
          >
            GDG Admin
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--c-text-subtle)" }}
          >
            v0.1
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            {link("/events", "Events")}
            {link("/sponsors", "Sponsors")}
            {link("/speakers", "Speakers")}
            {user.systemRole === "admin" ? link("/users", "Users") : null}
            <span className="mx-2 hidden h-5 w-px bg-[var(--c-border)] md:block" />
            <span
              className="hidden font-mono text-[11px] uppercase tracking-wider md:inline"
              style={{ color: "var(--c-text-muted)" }}
            >
              {user.systemRole}
            </span>
            <span className="hidden text-sm lg:inline">
              {user.fullName || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <Button asChild variant="primary">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
