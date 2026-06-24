import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { getSponsor } from "@/lib/server/sponsors";

import { SponsorForm, type SponsorFormValues } from "../../SponsorForm";

export default async function EditSponsorPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  await requireStaff();
  const { sponsorId } = await params;
  const sponsor = await getSponsor(sponsorId);
  if (!sponsor) notFound();

  const initial: SponsorFormValues = {
    id: sponsor.id,
    slug: sponsor.slug,
    name: sponsor.name,
    logoUrl: sponsor.logoUrl,
    description: sponsor.description,
    websiteUrl: sponsor.websiteUrl,
    defaultTier: sponsor.defaultTier,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Sponsors", href: "/sponsors" },
          { label: sponsor.name },
        ]}
        title={sponsor.name}
        subtitle={sponsor.defaultTier ?? null}
      />
      <SponsorForm mode="edit" initial={initial} />
    </div>
  );
}
