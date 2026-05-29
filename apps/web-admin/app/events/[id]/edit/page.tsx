import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";

import { EventForm, type EventFormValues } from "../../EventForm";
import { StatusActions } from "./StatusActions";

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">Events / Edit</div>
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            {event.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-[var(--c-text-muted)]">
            <span className="font-mono">{event.slug}</span>
            <span>·</span>
            <span className="chip chip-neutral">{event.status}</span>
          </div>
        </div>
        <Link href="/events">
          <Button variant="secondary">← All events</Button>
        </Link>
      </div>

      <div className="mb-10">
        <StatusActions id={event.id} status={event.status} />
      </div>

      <EventForm mode="edit" initial={initial} />
    </div>
  );
}
