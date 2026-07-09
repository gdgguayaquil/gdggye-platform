import { notFound } from "next/navigation";

import { requireUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { getMyPreCheckin } from "@/lib/server/pre-checkin";
import { isPreCheckinClosed } from "@gdggye/event-presentation";

import { PreCheckinForm, type PreCheckinFormValues } from "./PreCheckinForm";

const EVENT_SLUG = "bwai-2026";

export const metadata = {
  title: "Pre-checkin · BWAI 2026",
};

const STATUS_COPY = {
  pending: {
    title: "Tu pre-checkin está en revisión",
    body: "El staff revisará tu información antes del evento. Te avisaremos por aquí.",
    chip: "chip-yellow",
  },
  approved: {
    title: "¡Listo! Tu pre-checkin fue aprobado.",
    body: "Llega el día del evento con tu QR personal en /my-qr. Sin filas.",
    chip: "chip-green",
  },
  rejected: {
    title: "Tu pre-checkin necesita ajustes",
    body: "Mira los comentarios del staff abajo y reescríbelo el día del evento en la mesa de registro.",
    chip: "chip-red",
  },
} as const;

export default async function PreCheckinPage() {
  const user = await requireUser("/sign-in?next=/pre-checkin");
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) notFound();

  // Pre-checkin is gated by event.preCheckinDeadline. Null deadline =
  // organizer hasn't turned this workflow on for this event.
  const noPreCheckin = event.preCheckinDeadline === null;
  const closed = isPreCheckinClosed(event);

  const existing = await getMyPreCheckin(event.id, user.id);

  const header = (
    <div className="mb-6 text-center">
      <div className="eyebrow mb-2">Pre-checkin</div>
      <h1
        className="h-display mb-2"
        style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
      >
        Antes del evento
      </h1>
      <p className="mx-auto max-w-[480px] text-sm text-[var(--c-text-muted)]">
        Cuéntanos cómo prepararnos. Esto agiliza el registro físico y nos ayuda
        con la logística (badge, almuerzo, kit).
      </p>
    </div>
  );

  if (noPreCheckin) {
    return (
      <div className="container-x py-10">
        {header}
        <div className="mx-auto max-w-[480px] rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-6 text-center text-sm text-[var(--c-text-muted)]">
          Este evento aún no tiene pre-checkin habilitado.
        </div>
      </div>
    );
  }

  if (closed && !existing) {
    return (
      <div className="container-x py-10">
        {header}
        <div className="mx-auto max-w-[480px] rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-6 text-center text-sm text-[var(--c-text-muted)]">
          La fecha límite del pre-checkin ya pasó. Avísanos al llegar al evento
          si necesitas ajustes en el badge.
        </div>
      </div>
    );
  }

  // If finalized (approved/rejected), show status panel only. If still
  // pending, allow re-editing until the deadline.
  if (existing && existing.status !== "pending") {
    const c = STATUS_COPY[existing.status];
    return (
      <div className="container-x py-10">
        {header}
        <div className="mx-auto max-w-[520px]">
          <div className="rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <span className={`chip ${c.chip}`}>{existing.status}</span>
            <h2 className="mt-3 font-display text-xl font-semibold">
              {c.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--c-text-muted)]">{c.body}</p>
            {existing.status === "rejected" && existing.reviewNotes ? (
              <div className="mt-4 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-3 text-sm">
                <div className="eyebrow mb-1">Notas del staff</div>
                {existing.reviewNotes}
              </div>
            ) : null}
            <SummaryCard submission={existing} />
          </div>
        </div>
      </div>
    );
  }

  const initial: PreCheckinFormValues = {
    badgeName: existing?.badgeName ?? user.fullName ?? "",
    photoConsent: existing?.photoConsent ?? false,
    dietary: existing?.dietary ?? null,
    tshirtSize: existing?.tshirtSize ?? null,
    notes: existing?.notes ?? null,
  };

  return (
    <div className="container-x py-10">
      {header}
      <div className="mx-auto max-w-[520px]">
        {existing ? (
          <div className="mb-5 rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm">
            <span className="chip chip-yellow">pendiente</span>
            <span className="ml-2 text-[var(--c-text-muted)]">
              Puedes seguir editando hasta el{" "}
              {event.preCheckinDeadline!.toLocaleDateString("es-EC", {
                day: "numeric",
                month: "long",
              })}
              .
            </span>
          </div>
        ) : null}
        <PreCheckinForm initial={initial} />
      </div>
    </div>
  );
}

function SummaryCard({
  submission,
}: {
  submission: {
    badgeName: string;
    dietary: string | null;
    tshirtSize: string | null;
  };
}) {
  return (
    <dl className="mt-5 grid gap-2 text-sm">
      <Pair label="Badge" value={submission.badgeName} />
      <Pair label="Alimentación" value={submission.dietary ?? "—"} />
      <Pair label="Polera" value={submission.tshirtSize ?? "—"} />
    </dl>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <dt className="font-mono text-xs uppercase tracking-wider text-[var(--c-text-subtle)]">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
