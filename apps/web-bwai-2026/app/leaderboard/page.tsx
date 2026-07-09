import { notFound } from "next/navigation";

import { DEFAULT_LEADERBOARD_LIMIT } from "@gdggye/backend-core";

import { getCurrentAuthUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { getEventLeaderboard, getMyEventStats } from "@/lib/server/leaderboard";
import { eventAccent } from "@/lib/event-presentation";

import { LeaderboardClient } from "./LeaderboardClient";

// The bwai app *is* BWAI 2026; slug is hard-coded. Same pattern as the
// home page.
const EVENT_SLUG = "bwai-2026";

export const metadata = {
  title: "Tabla de posiciones · BWAI 2026",
};

export default async function LeaderboardPage() {
  const event = await findEventBySlug(EVENT_SLUG);
  if (!event) notFound();

  // Server fetch: top-N + viewer's rank in parallel.
  const [top, authUser] = await Promise.all([
    getEventLeaderboard(event.id, DEFAULT_LEADERBOARD_LIMIT),
    getCurrentAuthUser(),
  ]);

  const myStats = authUser
    ? await getMyEventStats(event.id, authUser.id)
    : null;

  const accent = eventAccent(event);

  return (
    <div className="container-x py-10">
      <div
        className={`accent-panel-${accent} relative mb-8 overflow-hidden rounded-[28px] px-6 py-9 text-center md:px-10`}
      >
        <div className="mb-2.5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] opacity-90">
          <span className="dot dot-pulse panel-pop" />
          {event.name} {event.year}
        </div>
        <h1
          className="h-display mb-2.5"
          style={{ fontSize: "clamp(30px, 5vw, 52px)" }}
        >
          Tabla de posiciones
        </h1>
        <p className="mx-auto max-w-[440px] text-[15px] opacity-90">
          Top {DEFAULT_LEADERBOARD_LIMIT}. Se actualiza en vivo mientras se
          escanean QRs en booths y actividades.
        </p>
      </div>

      <LeaderboardClient
        eventId={event.id}
        initialEntries={top}
        currentUserId={authUser?.id ?? null}
        initialMyRank={
          myStats
            ? { totalPoints: myStats.totalPoints, rank: myStats.rank }
            : null
        }
        limit={DEFAULT_LEADERBOARD_LIMIT}
      />
    </div>
  );
}
