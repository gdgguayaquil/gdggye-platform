import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";

import { EventForm, type EventFormValues } from "../../EventForm";
import { StatusActions } from "./StatusActions";

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

const STATUS_COLOR: Record<string, string> = {
  draft: "neutral",
  published: "blue",
  live: "green",
  closed: "yellow",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const event = await findEventById(id);
  if (!event) notFound();

  const initial: EventFormValues = {
    id: event.id,
    slug: event.slug,
    name: event.name,
    type: event.type,
    year: event.year,
    languageMode: event.languageMode,
    startAtIso: toLocalInput(event.startAt),
    endAtIso: toLocalInput(event.endAt),
    timezone: event.timezone,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    ticketUrl: event.ticketUrl,
    leaderboardEnabled: event.leaderboardEnabled,
    themeKey: event.themeKey,
    summaryEs: event.summaryEs,
    summaryEn: event.summaryEn,
    expectedAttendance: event.expectedAttendance,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Events", href: "/events" }, { label: event.name }]}
        title={event.name}
        subtitle={
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-xs">{event.slug}</span>
            <span className="text-[var(--c-text-subtle)]">·</span>
            <span
              className={`chip chip-${STATUS_COLOR[event.status] ?? "neutral"}`}
            >
              {event.status}
            </span>
          </div>
        }
      />

      <EventSubNav eventId={event.id} active="details" />

      <div className="mb-10">
        <StatusActions id={event.id} status={event.status} />
      </div>

      <EventForm mode="edit" initial={initial} />
    </div>
  );
}
