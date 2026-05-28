import { EventsView } from "@/components/views/events-view";
import { EVENTS } from "@/lib/data";

export default function EventsPage() {
  return <EventsView events={EVENTS} />;
}
