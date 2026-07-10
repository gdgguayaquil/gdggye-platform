import { notFound } from "next/navigation";

import { eventAccent } from "@gdggye/event-presentation";

import { requireUser } from "@/lib/server/auth";
import { getMyBadges } from "@/lib/server/badges";
import { findEventBySlug } from "@/lib/server/events";

const EVENT_SLUG = "bwai-2026";

export const metadata = {
  title: "Mis logros · BWAI 2026",
};

export default async function MyBadgesPage() {
  const user = await requireUser("/sign-in?next=/my-badges");
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) notFound();

  const badges = await getMyBadges(event.id, user.id);
  const accent = eventAccent(event);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="container-x py-10">
      <div
        className={`accent-panel-${accent} relative mx-auto mb-8 max-w-[480px] overflow-hidden rounded-[28px] px-6 py-8 text-center`}
      >
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          Mis logros · {event.name} {event.year}
        </div>
        <div
          className="font-display font-semibold leading-none"
          style={{
            fontSize: "clamp(56px, 12vw, 88px)",
            letterSpacing: "-0.04em",
          }}
        >
          {earnedCount}
          <span className="panel-pop align-baseline text-[0.32em] font-medium">
            /{badges.length}
          </span>
        </div>
        <p className="mt-2 text-[15px] opacity-90">
          {earnedCount === 0
            ? "Escanea booths y conoce gente para desbloquear logros."
            : earnedCount === badges.length
              ? "¡Los desbloqueaste todos!"
              : "Sigue escaneando para desbloquear el resto."}
        </p>
      </div>

      <ul className="mx-auto flex max-w-[480px] flex-col gap-3">
        {badges.map(({ badge, earned, current, threshold }) => {
          const pct = Math.round((current / threshold) * 100);
          return (
            <li
              key={badge.id}
              className="flex items-center gap-4 rounded-[var(--r-lg)] border border-[var(--c-border)] px-4 py-4"
              style={{ opacity: earned ? 1 : 0.72 }}
            >
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl"
                style={{
                  background: earned
                    ? "color-mix(in srgb, var(--c-primary) 14%, transparent)"
                    : "var(--c-surface)",
                  filter: earned ? "none" : "grayscale(1)",
                }}
                aria-hidden
              >
                {badge.icon ?? "🏅"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold">
                    {badge.name}
                  </span>
                  {earned ? (
                    <span className="chip chip-green">Desbloqueado</span>
                  ) : (
                    <span className="font-mono text-xs text-[var(--c-text-muted)]">
                      {current}/{threshold}
                    </span>
                  )}
                </div>
                {badge.description ? (
                  <p className="mt-0.5 text-xs text-[var(--c-text-muted)]">
                    {badge.description}
                  </p>
                ) : null}
                {!earned ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--c-surface)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "var(--c-primary)",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
