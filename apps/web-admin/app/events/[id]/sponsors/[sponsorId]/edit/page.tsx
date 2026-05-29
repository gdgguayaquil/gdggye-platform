import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@gdggye/ui-kit";

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">
            <Link href={`/events/${id}/sponsors`}>
              ← {event.name} / Sponsors
            </Link>
          </div>
          <h1
            className="h-display"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            {sponsor.name}
          </h1>
        </div>
        <Link href={`/events/${id}/sponsors`}>
          <Button variant="secondary">← All sponsors</Button>
        </Link>
      </div>
      <SponsorForm mode="edit" initial={initial} />
    </div>
  );
}
