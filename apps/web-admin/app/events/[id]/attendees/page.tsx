import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import {
  getRegistrationDetail,
  listEventRegistrations,
} from "@/lib/server/attendees";

import { AttendeesTable, type AttendeeRow } from "./AttendeesTable";
import { AttendeeDrawer, type AttendeeDetail } from "./AttendeeDrawer";

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attendee?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { attendee } = await searchParams;

  const event = await findEventById(id);
  if (!event) notFound();

  const registrations = await listEventRegistrations(id);

  const dateLabel = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: event.timezone,
    });
  const timeLabel = (d: Date) =>
    d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: event.timezone,
    });

  const rows: AttendeeRow[] = registrations.map((r) => ({
    userId: r.userId,
    fullName: r.fullName,
    email: r.email,
    preCheckinStatus: r.preCheckinStatus,
    totalPoints: r.totalPoints,
    rank: r.rank,
    registeredAtLabel: dateLabel(r.registeredAt),
  }));

  // Load the drawer's detail only when a row is selected via ?attendee=.
  // Keeps the page a single server render — no client-side data fetching.
  let detail: AttendeeDetail | null = null;
  if (attendee) {
    const d = await getRegistrationDetail(id, attendee);
    if (d) {
      detail = {
        userId: d.user.id,
        fullName: d.user.fullName,
        email: d.user.email,
        company: d.user.company,
        role: d.user.role,
        preCheckinStatus: d.registration.preCheckinStatus,
        totalPoints: d.registration.totalPoints,
        eventRank: d.registration.eventRank,
        registeredAtLabel: dateLabel(d.registration.registeredAt),
        reconciled: d.reconciled,
        ledgerSum: d.ledgerSum,
        ledger: d.ledger.map((e) => ({
          id: e.id,
          source: e.source,
          points: e.points,
          createdAtLabel: timeLabel(e.createdAt),
        })),
        scans: d.scans.map((s) => ({
          id: s.id,
          targetType: s.targetType,
          result: s.result,
          rejectReason: s.rejectReason,
          pointsGranted: s.pointsGranted,
          scannedAtLabel: timeLabel(s.scannedAt),
        })),
      };
    }
  }

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Attendees" },
        ]}
        title="Attendees"
        subtitle={
          registrations.length === 1
            ? "1 registered attendee"
            : `${registrations.length} registered attendees`
        }
      />
      <EventSubNav eventId={id} active="attendees" />

      <AttendeesTable
        eventId={id}
        rows={rows}
        selectedUserId={attendee ?? null}
      />

      {detail ? (
        <AttendeeDrawer detail={detail} closeHref={`/events/${id}/attendees`} />
      ) : null}
    </div>
  );
}
