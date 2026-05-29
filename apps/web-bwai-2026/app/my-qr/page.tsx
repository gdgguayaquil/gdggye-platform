import { notFound, redirect } from "next/navigation";

import { canParticipateInEvents } from "@gdggye/backend-core";

import { requireUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { mintAttendeeQrToken } from "@/lib/server/qr";
import { ensureRegistration } from "@/lib/server/registrations";

import { MyQrCard } from "./MyQrCard";

const EVENT_SLUG = "bwai-2026";

export default async function MyQrPage() {
  const user = await requireUser("/sign-in?next=/my-qr");

  if (!canParticipateInEvents(user)) {
    redirect("/profile?next=/my-qr");
  }

  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) notFound();

  // ensureRegistration must succeed before minting — the QR is only useful
  // if there's a registration row to credit points against.
  await ensureRegistration({ eventId: event.id, userId: user.id });
  const token = await mintAttendeeQrToken(event.id, user.id);

  return (
    <div className="container-x py-12">
      <div className="mb-8 text-center">
        <div className="eyebrow mb-3">Tu pase</div>
        <h1
          className="h-display"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          Mi QR
        </h1>
        <p className="mt-3 mx-auto max-w-[440px] text-[var(--c-text-muted)]">
          Presenta este QR en el evento. Es único para ti.
        </p>
      </div>

      <MyQrCard
        token={token}
        fullName={user.fullName}
        email={user.email}
        eventName={`${event.name} ${event.year}`}
      />
    </div>
  );
}
