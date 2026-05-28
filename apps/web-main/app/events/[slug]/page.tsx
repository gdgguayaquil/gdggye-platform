import { notFound } from "next/navigation";

import { EventDetailView } from "@/components/views/event-detail-view";
import { findEventBySlug, findEventContent } from "@/lib/server/events";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await findEventBySlug(slug);
  if (!event) {
    notFound();
  }
  const detail = await findEventContent(slug);

  return <EventDetailView event={event} detail={detail} />;
}
