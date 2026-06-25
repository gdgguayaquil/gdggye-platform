import { notFound } from "next/navigation";

import { DEFAULT_LEADERBOARD_LIMIT } from "@gdggye/backend-core";

import { getCurrentAuthUser } from "@/lib/server/auth";
import { findEventBySlug } from "@/lib/server/events";
import { getEventLeaderboard, getMyEventStats } from "@/lib/server/leaderboard";

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

  return (
    <div className="container-x py-10">
      <div className="mb-6 text-center">
        <div className="eyebrow mb-2">BWAI 2026</div>
        <h1
          className="h-display mb-2"
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          Tabla de posiciones
        </h1>
        <p className="mx-auto max-w-[440px] text-sm text-[var(--c-text-muted)]">
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
