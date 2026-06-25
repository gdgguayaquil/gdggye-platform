import type { PointBreakdownItem } from "../../domain/entities/Leaderboard";

export interface PointTransactionRepository {
  // Sum/count of point_transactions for one user at one event, grouped
  // by source_type. RLS-safe via the user-scoped client: the caller
  // queries their own rows.
  breakdownForUser(
    eventId: string,
    userId: string,
  ): Promise<PointBreakdownItem[]>;
}
