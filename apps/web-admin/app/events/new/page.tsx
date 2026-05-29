import { requireStaff } from "@/lib/server/auth";

import { EventForm, type EventFormValues } from "../EventForm";

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default async function NewEventPage() {
  await requireStaff();

  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);

  const initial: EventFormValues = {
    slug: "",
    name: "",
    type: "meetup",
    year: new Date().getFullYear(),
    languageMode: "bilingual",
    startAtIso: toLocalInput(start),
    endAtIso: toLocalInput(end),
    timezone: "America/Guayaquil",
    venueName: null,
    venueAddress: null,
    ticketUrl: null,
    leaderboardEnabled: true,
    themeKey: "gdggye-core",
    summaryEs: null,
    summaryEn: null,
    expectedAttendance: null,
  };

  return (
    <div className="container-x py-12">
      <div className="mb-8">
        <div className="eyebrow mb-3">Events / New</div>
        <h1
          className="h-display"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          New event
        </h1>
      </div>
      <EventForm mode="create" initial={initial} />
    </div>
  );
}
