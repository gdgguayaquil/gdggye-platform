import { notFound } from "next/navigation";

import { EventSubNav } from "@/components/event-sub-nav";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { findEventById } from "@/lib/server/events";

import { SponsorForm, type SponsorFormValues } from "../SponsorForm";

export default async function NewSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const event = await findEventById(id);
  if (!event) notFound();

  const initial: SponsorFormValues = {
    eventId: id,
    name: "",
    tier: null,
    logoUrl: null,
    description: null,
    boothLabel: null,
    isActive: true,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Events", href: "/events" },
          { label: event.name, href: `/events/${id}/edit` },
          { label: "Sponsors", href: `/events/${id}/sponsors` },
          { label: "New" },
        ]}
        title="New sponsor"
      />
      <EventSubNav eventId={id} active="sponsors" />
      <SponsorForm mode="create" initial={initial} />
    </div>
  );
}
