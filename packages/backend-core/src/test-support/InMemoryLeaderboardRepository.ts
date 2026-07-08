import type {
  LeaderboardEntry,
  PointBreakdownItem,
} from "../domain/entities/Leaderboard";
import type {
  LeaderboardRepository,
  UserRankSummary,
} from "../application/ports/LeaderboardRepository";
import type { PointTransactionRepository } from "../application/ports/PointTransactionRepository";

// Both repos combined into one class for test ergonomics — in production
// they're two SECURITY DEFINER RPCs backed by different queries, but the
// leaderboard use-case only cares about the port contracts.
export class InMemoryLeaderboardRepository
  implements LeaderboardRepository, PointTransactionRepository
{
  constructor(
    private entries: LeaderboardEntry[] = [],
    private breakdowns: Map<string, PointBreakdownItem[]> = new Map(),
  ) {}

  async top(_eventId: string, limit: number): Promise<LeaderboardEntry[]> {
    return this.entries.slice(0, limit);
  }

  async userRank(
    _eventId: string,
    userId: string,
  ): Promise<UserRankSummary | null> {
    const found = this.entries.find((e) => e.userId === userId);
    if (!found) return null;
    return { totalPoints: found.totalPoints, rank: found.rank };
  }

  async breakdownForUser(
    _eventId: string,
    userId: string,
  ): Promise<PointBreakdownItem[]> {
    return this.breakdowns.get(userId) ?? [];
  }
}
