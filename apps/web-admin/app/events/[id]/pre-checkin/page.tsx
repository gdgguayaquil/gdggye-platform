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

import { SubmissionActions } from "./SubmissionActions";

const TABS: { key: SubmittedPreCheckinStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const SLOT_COLS = "200px 100px 1fr 80px 80px 80px 280px";

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

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SLOT_COLS }}
        >
          <div>Attendee</div>
          <div>Status</div>
          <div>Badge / dietary / notes</div>
          <div>Shirt</div>
          <div>Photo</div>
          <div>Submitted</div>
          <div />
        </div>
        {submissions.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            Nothing to review.
          </div>
        ) : (
          submissions.map((s) => {
            const u = userMap.get(s.userId);
            return (
              <div
                key={s.id}
                className="grid items-start gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
                style={{ gridTemplateColumns: SLOT_COLS }}
              >
                <div>
                  <div className="font-display font-semibold">
                    {u?.fullName || "—"}
                  </div>
                  <div className="font-mono text-xs text-[var(--c-text-subtle)]">
                    {u?.email ?? s.userId.slice(0, 8)}
                  </div>
                </div>
                <div>
                  <span
                    className={`chip ${
                      s.status === "approved"
                        ? "chip-green"
                        : s.status === "rejected"
                          ? "chip-red"
                          : "chip-yellow"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div>
                  <div className="font-display font-semibold">
                    {s.badgeName}
                  </div>
                  {s.dietary ? (
                    <div className="text-xs text-[var(--c-text-muted)]">
                      Diet: {s.dietary}
                    </div>
                  ) : null}
                  {s.notes ? (
                    <div className="text-xs text-[var(--c-text-subtle)]">
                      "{s.notes}"
                    </div>
                  ) : null}
                  {s.status === "rejected" && s.reviewNotes ? (
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--c-red)" }}
                    >
                      Rejected: {s.reviewNotes}
                    </div>
                  ) : null}
                </div>
                <div className="font-mono text-xs">{s.tshirtSize ?? "—"}</div>
                <div className="font-mono text-xs">
                  {s.photoConsent ? "yes" : "no"}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {s.submittedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div>
                  {s.status === "pending" ? (
                    <SubmissionActions submissionId={s.id} eventId={id} />
                  ) : (
                    <span className="text-xs text-[var(--c-text-subtle)]">
                      reviewed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
