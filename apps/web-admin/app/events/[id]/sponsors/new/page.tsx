import { notFound } from "next/navigation";

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
      <div className="mb-8">
        <div className="eyebrow mb-3">{event.name} / Sponsors / New</div>
        <h1
          className="h-display"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          New sponsor
        </h1>
      </div>
      <SponsorForm mode="create" initial={initial} />
    </div>
  );
}
