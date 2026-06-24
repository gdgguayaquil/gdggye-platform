import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";

import { SponsorForm, type SponsorFormValues } from "../SponsorForm";

export default async function NewSponsorPage() {
  await requireStaff();

  const initial: SponsorFormValues = {
    slug: "",
    name: "",
    logoUrl: null,
    description: null,
    websiteUrl: null,
    defaultTier: null,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Sponsors", href: "/sponsors" }, { label: "New" }]}
        title="New sponsor"
        subtitle="Define the sponsor once; attach to any event."
      />
      <SponsorForm mode="create" initial={initial} />
    </div>
  );
}
