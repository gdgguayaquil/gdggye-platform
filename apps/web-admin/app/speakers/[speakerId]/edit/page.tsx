import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/server/auth";
import { getSpeaker } from "@/lib/server/speakers";

import { SpeakerForm, type SpeakerFormValues } from "../../SpeakerForm";

export default async function EditSpeakerPage({
  params,
}: {
  params: Promise<{ speakerId: string }>;
}) {
  await requireStaff();
  const { speakerId } = await params;
  const speaker = await getSpeaker(speakerId);
  if (!speaker) notFound();

  const initial: SpeakerFormValues = {
    id: speaker.id,
    slug: speaker.slug,
    name: speaker.name,
    roleEs: speaker.roleEs,
    roleEn: speaker.roleEn,
    city: speaker.city,
    bioEs: speaker.bioEs,
    bioEn: speaker.bioEn,
    photoUrl: speaker.photoUrl,
    websiteUrl: speaker.websiteUrl,
    githubUrl: speaker.githubUrl,
    xUrl: speaker.xUrl,
    linkedinUrl: speaker.linkedinUrl,
  };

  return (
    <div className="container-x py-12">
      <PageHeader
        crumbs={[
          { label: "Speakers", href: "/speakers" },
          { label: speaker.name },
        ]}
        title={speaker.name}
        subtitle={speaker.roleEs ?? speaker.roleEn ?? null}
      />
      <SpeakerForm mode="edit" initial={initial} />
    </div>
  );
}
