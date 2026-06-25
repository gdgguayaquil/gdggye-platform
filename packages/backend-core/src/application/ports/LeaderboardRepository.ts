import type { LeaderboardEntry } from "../../domain/entities/Leaderboard";

export interface UserRankSummary {
  totalPoints: number;
  rank: number;
}

export interface LeaderboardRepository {
  top(eventId: string, limit: number): Promise<LeaderboardEntry[]>;
  // Null when the user isn't registered to the event yet.
  userRank(eventId: string, userId: string): Promise<UserRankSummary | null>;
}
