import { notFound } from "next/navigation";

import { EventDetailView } from "@/components/views/event-detail-view";
import { EVENTS, getEventBySlug, getEventDetail } from "@/lib/data";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) {
    notFound();
  }
  const detail = getEventDetail(slug);

  return <EventDetailView event={event} detail={detail ?? null} />;
}
