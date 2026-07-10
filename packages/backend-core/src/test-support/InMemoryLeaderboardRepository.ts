import type {
  LeaderboardEntry,
  PointBreakdownItem,
  PointLedgerEntry,
} from "../domain/entities/Leaderboard";
import type {
  LeaderboardRepository,
  UserRankSummary,
} from "../application/ports/LeaderboardRepository";
import type {
  InsertPointTransactionInput,
  PointTransactionRepository,
} from "../application/ports/PointTransactionRepository";

// Both repos combined into one class for test ergonomics — in production
// they're two SECURITY DEFINER RPCs backed by different queries, but the
// leaderboard use-case only cares about the port contracts.
export class InMemoryLeaderboardRepository
  implements LeaderboardRepository, PointTransactionRepository
{
  constructor(
    private entries: LeaderboardEntry[] = [],
    private breakdowns: Map<string, PointBreakdownItem[]> = new Map(),
    private ledgers: Map<string, PointLedgerEntry[]> = new Map(),
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

  async listForUser(
    _eventId: string,
    userId: string,
  ): Promise<PointLedgerEntry[]> {
    return this.ledgers.get(userId) ?? [];
  }

  // Records the insert so tests can assert what the use-case appended. The
  // real adapter delegates the running-total update to a DB trigger; here we
  // just capture the row.
  public inserted: InsertPointTransactionInput[] = [];
  async insert(input: InsertPointTransactionInput): Promise<{ id: string }> {
    this.inserted.push(input);
    const id = `pt-${this.inserted.length}`;
    const existing = this.ledgers.get(input.userId) ?? [];
    this.ledgers.set(input.userId, [
      {
        id,
        eventId: input.eventId,
        userId: input.userId,
        source: input.sourceType,
        sourceId: input.sourceId,
        points: input.points,
        note: input.note,
        createdAt: input.createdAt,
      },
      ...existing,
    ]);
    return { id };
  }
}
