import { EventsView } from "@/components/views/events-view";
import { listPublishedEvents } from "@/lib/server/events";

export default async function EventsPage() {
  const events = await listPublishedEvents();
  return <EventsView events={events} />;
}
