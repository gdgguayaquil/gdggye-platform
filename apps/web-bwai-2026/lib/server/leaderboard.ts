import "server-only";

import {
  DEFAULT_LEADERBOARD_LIMIT,
  getEventLeaderboard as getEventLeaderboardUseCase,
  getMyEventStats as getMyEventStatsUseCase,
} from "@gdggye/backend-core";

import { getSupabaseRepos } from "./supabase";

// Initial top-N for the server-rendered shell. The client component
// re-fetches via the same RPC over Realtime ticks.
export async function getEventLeaderboard(
  eventId: string,
  limit: number = DEFAULT_LEADERBOARD_LIMIT,
) {
  const { leaderboardRepo } = await getSupabaseRepos();
  return getEventLeaderboardUseCase(eventId, { leaderboardRepo }, limit);
}

// Returns null when the user isn't registered to the event.
export async function getMyEventStats(eventId: string, userId: string) {
  const { leaderboardRepo, pointTxRepo } = await getSupabaseRepos();
  return getMyEventStatsUseCase(eventId, userId, {
    leaderboardRepo,
    pointTxRepo,
  });
}
