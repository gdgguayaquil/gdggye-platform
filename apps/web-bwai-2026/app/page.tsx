import { notFound } from "next/navigation";

import { EventDetailView } from "@/components/views/event-detail-view";
import { findEventBySlug, findEventContent } from "@/lib/server/events";

// The bwai-2026 app *is* the BWAI 2026 event. The slug is hard-coded; the
// data lives in the same Supabase tables as web-main, but with the
// bwai-2026 theme applied at the layout level.
const EVENT_SLUG = "bwai-2026";

export default async function HomePage() {
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) {
    notFound();
  }
  const detail = await findEventContent(EVENT_SLUG);
  return <EventDetailView event={event} detail={detail} hideBackLink />;
}
