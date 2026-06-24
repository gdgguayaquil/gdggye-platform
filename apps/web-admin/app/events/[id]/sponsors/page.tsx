import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { listEventSponsors } from "@/lib/server/event-sponsors";
import { findEventById } from "@/lib/server/events";
import { listAllSponsors } from "@/lib/server/sponsors";

import {
  EventSponsorsManager,
  type AttachmentRow,
  type SponsorOption,
} from "./EventSponsorsManager";

export default async function EventSponsorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const [event, attachments, sponsors] = await Promise.all([
    findEventById(id),
    listEventSponsors(id),
    listAllSponsors(),
  ]);
  if (!event) notFound();

  const sponsorIndex = new Map(sponsors.map((s) => [s.id, s]));
  const allOptions: SponsorOption[] = sponsors.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    defaultTier: s.defaultTier,
  }));
  const attachmentRows: AttachmentRow[] = attachments
    .map<AttachmentRow | null>((a) => {
      const sponsor = sponsorIndex.get(a.sponsorId);
      if (!sponsor) return null; // orphaned — sponsor deleted; skip.
      return {
        id: a.id,
        sponsorId: a.sponsorId,
        sponsor: {
          id: sponsor.id,
          slug: sponsor.slug,
          name: sponsor.name,
          defaultTier: sponsor.defaultTier,
        },
        tier: a.tier,
        boothLabel: a.boothLabel,
        isActive: a.isActive,
      };
    })
    .filter((r): r is AttachmentRow => r !== null);

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Sponsors" },
        ]}
        title="Sponsors"
        subtitle={`${attachmentRows.length} attached. Reuse from the global list, or create a new sponsor.`}
      />
      <EventSubNav eventId={id} active="sponsors" />
      <EventSponsorsManager
        eventId={id}
        attachments={attachmentRows}
        allSponsors={allOptions}
      />
    </div>
  );
}
