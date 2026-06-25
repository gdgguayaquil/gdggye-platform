import { notFound } from "next/navigation";

import { requireUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { getMyEventStats } from "@/lib/server/leaderboard";

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

  return (
    <div className="container-x py-10">
      <div className="mb-6 text-center">
        <div className="eyebrow mb-2">Mis puntos</div>
        <h1
          className="h-display mb-2"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          {stats.totalPoints}
          <span className="ml-2 text-lg font-normal text-[var(--c-text-muted)]">
            pts
          </span>
        </h1>
        {stats.rank !== null ? (
          <p className="text-sm text-[var(--c-text-muted)]">
            Posición #{stats.rank} en la tabla.
          </p>
        ) : (
          <p className="text-sm text-[var(--c-text-muted)]">
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
