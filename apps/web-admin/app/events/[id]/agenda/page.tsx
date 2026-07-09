import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { listAgendaSlots } from "@/lib/server/agenda";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { listAllSpeakers } from "@/lib/server/speakers";
import { SupabaseAgendaSlotRepository } from "@gdggye/supabase-adapters";

import { getSupabaseServerClient } from "@/lib/server/supabase";
import { DeleteSlotButton } from "./DeleteSlotButton";

// 5-column grid. Inline gridTemplateColumns for Tailwind v4 reliability.
const SLOT_COLS = "120px 60px minmax(0, 2fr) 140px 180px 200px";

export default async function AgendaListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const [event, slots, speakers, supabase] = await Promise.all([
    findEventById(id),
    listAgendaSlots(id),
    listAllSpeakers(),
    getSupabaseServerClient(),
  ]);
  if (!event) notFound();

  // Fetch slot speaker links for all slots in one shot to render names.
  const slotRepo = new SupabaseAgendaSlotRepository(supabase);
  const links = await slotRepo.listSpeakerLinksForEvent(id);

  const speakerIndex = new Map(speakers.map((s) => [s.id, s]));
  const linksBySlot = new Map<string, typeof links>();
  for (const l of links) {
    const arr = linksBySlot.get(l.slotId) ?? [];
    arr.push(l);
    linksBySlot.set(l.slotId, arr);
  }

  const timeFmt = new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: event.timezone,
  });

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Agenda" },
        ]}
        title="Agenda"
        subtitle={`${slots.length} slot${slots.length === 1 ? "" : "s"}. Times shown in ${event.timezone}.`}
        actions={
          <Button asChild variant="primary">
            <Link href={`/events/${id}/agenda/new`}>+ New slot</Link>
          </Button>
        }
      />

      <EventSubNav eventId={id} active="agenda" />

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
        <div
          className="grid gap-4 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-[var(--c-text-muted)]"
          style={{ gridTemplateColumns: SLOT_COLS }}
        >
          <div>Start</div>
          <div>Dur</div>
          <div>Title</div>
          <div>Track</div>
          <div>Room / Speakers</div>
          <div />
        </div>
        {slots.length === 0 ? (
          <div className="px-5 py-10 text-center text-[var(--c-text-muted)]">
            No agenda slots yet. Create the first one.
          </div>
        ) : (
          slots.map((slot) => {
            const slotLinks = (linksBySlot.get(slot.id) ?? [])
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder);
            return (
              <div
                key={slot.id}
                className="grid items-start gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
                style={{ gridTemplateColumns: SLOT_COLS }}
              >
                <div className="font-mono text-sm font-medium">
                  {timeFmt.format(slot.startAt)}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {slot.durationMinutes}m
                </div>
                <div>
                  <div className="font-display font-semibold">
                    {slot.titleEs || slot.titleEn}
                  </div>
                  {slot.titleEn && slot.titleEs ? (
                    <div className="text-xs text-[var(--c-text-subtle)]">
                      {slot.titleEn}
                    </div>
                  ) : null}
                </div>
                <div className="font-mono text-xs text-[var(--c-text-muted)]">
                  {slot.track ?? "—"}
                </div>
                <div className="text-xs">
                  <div className="font-mono text-[var(--c-text-muted)]">
                    {slot.room || "—"}
                  </div>
                  {slotLinks.length > 0 ? (
                    <div className="mt-1 text-[var(--c-text-muted)]">
                      {slotLinks
                        .map((l) => speakerIndex.get(l.speakerId)?.name ?? "?")
                        .join(" · ")}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/events/${id}/agenda/${slot.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <DeleteSlotButton slotId={slot.id} eventId={id} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
