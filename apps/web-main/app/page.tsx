import { HomeView } from "@/components/views/home-view";
import { listPublishedEvents } from "@/lib/server/events";

export default async function HomePage() {
  const events = await listPublishedEvents();
  return <HomeView events={events} />;
}
