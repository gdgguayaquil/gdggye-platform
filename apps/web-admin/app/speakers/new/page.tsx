import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";

import { SpeakerForm, type SpeakerFormValues } from "../SpeakerForm";

export default async function NewSpeakerPage() {
  await requireStaff();

  const initial: SpeakerFormValues = {
    slug: "",
    name: "",
    roleEs: null,
    roleEn: null,
    city: null,
    bioEs: null,
    bioEn: null,
    photoUrl: null,
    websiteUrl: null,
    githubUrl: null,
    xUrl: null,
    linkedinUrl: null,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[{ label: "Speakers", href: "/speakers" }, { label: "New" }]}
        title="New speaker"
        subtitle="Define the speaker once; attach to any event."
      />
      <SpeakerForm mode="create" initial={initial} />
    </div>
  );
}
