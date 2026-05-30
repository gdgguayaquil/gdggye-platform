import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";
import { getSponsor } from "@/lib/server/sponsors";

import { SponsorForm, type SponsorFormValues } from "../../SponsorForm";

export default async function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string; sponsorId: string }>;
}) {
  await requireStaff();
  const { id, sponsorId } = await params;

  const [event, sponsor] = await Promise.all([
    findEventById(id),
    getSponsor(sponsorId),
  ]);
  if (!event || !sponsor || sponsor.eventId !== id) notFound();

  const initial: SponsorFormValues = {
    id: sponsor.id,
    eventId: id,
    name: sponsor.name,
    tier: sponsor.tier,
    logoUrl: sponsor.logoUrl,
    description: sponsor.description,
    boothLabel: sponsor.boothLabel,
    isActive: sponsor.isActive,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Sponsors", href: `/events/${id}/sponsors` },
          { label: sponsor.name },
        ]}
        title={sponsor.name}
        subtitle={sponsor.tier ?? null}
      />
      <EventSubNav eventId={id} active="sponsors" />
      <SponsorForm mode="edit" initial={initial} />
    </div>
  );
}
