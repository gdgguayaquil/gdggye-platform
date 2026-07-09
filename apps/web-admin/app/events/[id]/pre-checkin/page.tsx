import Link from "next/link";
import { notFound } from "next/navigation";

import type { SubmittedPreCheckinStatus } from "@gdggye/backend-core";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listPreCheckinForEvent } from "@/lib/server/pre-checkin";
import { SupabaseUserRepository } from "@gdggye/supabase-adapters";
import { getSupabaseServerClient } from "@/lib/server/supabase";

import { PreCheckinList, type PreCheckinRow } from "./PreCheckinList";

const TABS: { key: SubmittedPreCheckinStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function PreCheckinQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { status: statusParam } = await searchParams;

  const event = await findEventById(id);
  if (!event) notFound();

  const status: SubmittedPreCheckinStatus | undefined =
    statusParam === "pending" ||
    statusParam === "approved" ||
    statusParam === "rejected"
      ? statusParam
      : undefined;
  const activeKey = status ?? "all";

  const submissions = await listPreCheckinForEvent(
    id,
    status ? { status } : undefined,
  );

  // Hydrate attendee identity. listPreCheckinForEvent returns raw rows
  // with user_id only; we look up names from public.users using the same
  // server-side client. Could later be a join inside the repo for fewer
  // round trips; cardinality is small enough that two queries are fine.
  const supabase = await getSupabaseServerClient();
  const userRepo = new SupabaseUserRepository(supabase);
  const userMap = new Map<string, { fullName: string; email: string }>();
  await Promise.all(
    [...new Set(submissions.map((s) => s.userId))].map(async (uid) => {
      const u = await userRepo.findById(uid);
      if (u) userMap.set(uid, { fullName: u.fullName, email: u.email });
    }),
  );

  // Flatten to a serializable shape for the client component. Dates are
  // pre-formatted so the client stays a pure display + selection layer
  // (no Date props crossing the RSC boundary).
  const rows: PreCheckinRow[] = submissions.map((s) => {
    const u = userMap.get(s.userId);
    return {
      id: s.id,
      status: s.status,
      badgeName: s.badgeName,
      dietary: s.dietary,
      tshirtSize: s.tshirtSize,
      notes: s.notes,
      photoConsent: s.photoConsent,
      reviewNotes: s.reviewNotes,
      submittedAtLabel: s.submittedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullName: u?.fullName ?? "",
      email: u?.email ?? "",
      userIdHint: s.userId.slice(0, 8),
    };
  });

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Pre-checkin" },
        ]}
        title="Pre-checkin"
        subtitle={
          event.preCheckinDeadline
            ? `Deadline: ${event.preCheckinDeadline.toLocaleString("en-US", { timeZone: event.timezone })}`
            : "No deadline set — set one on the event details page to enable pre-checkin."
        }
      />
      <EventSubNav eventId={id} active="pre-checkin" />

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => {
          const href =
            t.key === "all"
              ? `/events/${id}/pre-checkin`
              : `/events/${id}/pre-checkin?status=${t.key}`;
          const isActive = t.key === activeKey;
          return (
            <Link
              key={t.key}
              href={href}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: isActive ? "var(--c-text)" : "var(--c-border)",
                background: isActive ? "var(--c-text)" : "transparent",
                color: isActive ? "var(--c-bg)" : "var(--c-text-muted)",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <PreCheckinList eventId={id} rows={rows} />
    </div>
  );
}
