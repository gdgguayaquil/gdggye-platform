import type {
  LeaderboardEntry,
  MyEventStats,
} from "../../../domain/entities/Leaderboard";
import type { LeaderboardRepository } from "../../ports/LeaderboardRepository";
import type { PointTransactionRepository } from "../../ports/PointTransactionRepository";

export const DEFAULT_LEADERBOARD_LIMIT = 20;

export interface LeaderboardDeps {
  leaderboardRepo: LeaderboardRepository;
}

export async function getEventLeaderboard(
  eventId: string,
  deps: LeaderboardDeps,
  limit: number = DEFAULT_LEADERBOARD_LIMIT,
): Promise<LeaderboardEntry[]> {
  // Caller picks `limit`; clamp lower bound so a stray 0 from a query
  // string doesn't return an empty board. The RPC also clamps but we
  // belt-and-suspender here.
  return deps.leaderboardRepo.top(eventId, Math.max(limit, 1));
}

export interface MyEventStatsDeps {
  leaderboardRepo: LeaderboardRepository;
  pointTxRepo: PointTransactionRepository;
}

// Two reads run in parallel: rank summary (from the security-definer RPC)
// and the per-source breakdown (from point_transactions, RLS-scoped to
// the caller's own rows).
export async function getMyEventStats(
  eventId: string,
  userId: string,
  deps: MyEventStatsDeps,
): Promise<MyEventStats> {
  const [rank, breakdown] = await Promise.all([
    deps.leaderboardRepo.userRank(eventId, userId),
    deps.pointTxRepo.breakdownForUser(eventId, userId),
  ]);
  return {
    eventId,
    userId,
    totalPoints: rank?.totalPoints ?? 0,
    rank: rank?.rank ?? null,
    breakdown,
  };
}
