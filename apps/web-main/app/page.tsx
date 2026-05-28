import { HomeView } from "@/components/views/home-view";
import { EVENTS } from "@/lib/data";

export default function HomePage() {
  return <HomeView events={EVENTS} />;
}
