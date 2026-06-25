import { notFound } from "next/navigation";

import { RegistrationBlocked } from "@gdggye/backend-core";

import { EventDetailView } from "@/components/views/event-detail-view";
import { getCurrentUser } from "@/lib/server/auth";
import { findEventDetail } from "@/lib/server/events";
import { ensureRegistration } from "@/lib/server/registrations";

// The bwai-2026 app *is* the BWAI 2026 event. The slug is hard-coded; the
// data lives in the same Supabase tables as web-main, but with the
// bwai-2026 theme applied at the layout level.
const EVENT_SLUG = "bwai-2026";

export default async function HomePage() {
  const [found, user] = await Promise.all([
    findEventDetail(EVENT_SLUG),
    getCurrentUser(),
  ]);
  if (!found) notFound();
  const { event, detail } = found;

  let isRegistered = false;
  if (user) {
    try {
      await ensureRegistration({ eventId: event.id, userId: user.id });
      isRegistered = true;
    } catch (e) {
      // Friendliest UX: render the public event page even if the user can't
      // register yet. The /profile page surfaces what's missing. Other
      // unexpected errors still bubble.
      if (
        !(e instanceof RegistrationBlocked) ||
        e.reason !== "profile_incomplete"
      ) {
        throw e;
      }
    }
  }

  return (
    <EventDetailView
      event={event}
      detail={detail}
      hideBackLink
      isRegistered={isRegistered}
    />
  );
}
