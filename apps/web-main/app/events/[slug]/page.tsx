import { notFound } from "next/navigation";

import { EventDetailView } from "@/components/views/event-detail-view";
import { findEventDetail } from "@/lib/server/events";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await findEventDetail(slug);
  if (!found) notFound();
  return <EventDetailView event={found.event} detail={found.detail} />;
}
