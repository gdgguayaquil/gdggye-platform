import type {
  PointBreakdownItem,
  PointLedgerEntry,
} from "../../domain/entities/Leaderboard";

export interface PointTransactionRepository {
  // Sum/count of point_transactions for one user at one event, grouped
  // by source_type. RLS-safe via the user-scoped client: the caller
  // queries their own rows.
  breakdownForUser(
    eventId: string,
    userId: string,
  ): Promise<PointBreakdownItem[]>;

  // Every point_transactions row for one user at one event, newest first.
  // Admin read behind pt_self_read (is_staff branch). The un-aggregated
  // ledger the attendee drawer renders.
  listForUser(eventId: string, userId: string): Promise<PointLedgerEntry[]>;
}
