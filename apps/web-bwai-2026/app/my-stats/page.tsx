import { notFound } from "next/navigation";

import { requireUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { getMyEventStats } from "@/lib/server/leaderboard";
import { eventAccent } from "@gdggye/event-presentation";

const EVENT_SLUG = "bwai-2026";

export const metadata = {
  title: "Mis puntos · BWAI 2026",
};

// Per-source labels. Closed over the PointSource union so adding a new
// source in the schema/use-case forces a label entry here at compile time.
const SOURCE_COPY: Record<
  "sponsor" | "activity" | "networking" | "bonus" | "admin_adjustment",
  { title: string; sub: string }
> = {
  sponsor: { title: "Sponsors", sub: "Booths escaneados" },
  activity: { title: "Actividades", sub: "Talleres y demos" },
  networking: { title: "Networking", sub: "Otros asistentes" },
  bonus: { title: "Bonus", sub: "Premios del evento" },
  admin_adjustment: { title: "Ajuste manual", sub: "Por organización" },
};

export default async function MyStatsPage() {
  const user = await requireUser("/sign-in?next=/my-stats");
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) notFound();

  const stats = await getMyEventStats(event.id, user.id);
  const accent = eventAccent(event);

  return (
    <div className="container-x py-10">
      <div
        className={`accent-panel-${accent} relative mx-auto mb-8 max-w-[480px] overflow-hidden rounded-[28px] px-6 py-9 text-center`}
      >
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          Mis puntos · {event.name} {event.year}
        </div>
        <div
          className="font-display font-semibold leading-none"
          style={{
            fontSize: "clamp(72px, 15vw, 120px)",
            letterSpacing: "-0.04em",
          }}
        >
          {stats.totalPoints}
          <span className="panel-pop ml-2 align-baseline text-[0.28em] font-medium uppercase tracking-wider">
            pts
          </span>
        </div>
        {stats.rank !== null ? (
          <p className="mt-3 text-[15px] opacity-90">
            Posición{" "}
            <span className="panel-pop font-semibold">#{stats.rank}</span> en la
            tabla.
          </p>
        ) : (
          <p className="mt-3 text-[15px] opacity-90">
            Aún no estás en la tabla. Escanea tu primer QR para entrar.
          </p>
        )}
      </div>

      <div className="mx-auto max-w-[480px]">
        <h2 className="eyebrow mb-3">Desglose</h2>
        {stats.breakdown.length === 0 ? (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-border)] px-5 py-8 text-center text-sm text-[var(--c-text-muted)]">
            Sin escaneos aún. Ve al escáner y suma puntos.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)]">
            {stats.breakdown.map((item) => {
              const c = SOURCE_COPY[item.source];
              return (
                <div
                  key={item.source}
                  className="grid items-center gap-4 border-b border-[var(--c-border)] px-5 py-4 last:border-b-0"
                  style={{ gridTemplateColumns: "1fr 80px 80px" }}
                >
                  <div>
                    <div className="font-display font-semibold">{c.title}</div>
                    <div className="text-xs text-[var(--c-text-subtle)]">
                      {c.sub}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-[var(--c-text-muted)]">
                    {item.count} escan{item.count === 1 ? "" : "es"}
                  </div>
                  <div className="text-right font-mono text-sm font-semibold tabular-nums">
                    {item.total} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
