import type {
  PointBreakdownItem,
  PointLedgerEntry,
  PointSource,
} from "../../domain/entities/Leaderboard";

// A row to append to the ledger. Today only admin_adjustment inserts flow
// through here (scans use the service-role ScanRepository); the shape is
// kept general so future server-authorized grants can reuse it.
export interface InsertPointTransactionInput {
  eventId: string;
  userId: string;
  sourceType: PointSource;
  sourceId: string | null;
  points: number;
  note: string | null;
  actorUserId: string | null;
  createdAt: Date;
}

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

  // Appends one transaction. The DB trigger updates registrations.total_points
  // — callers never write the total directly. Returns the new row id.
  insert(input: InsertPointTransactionInput): Promise<{ id: string }>;
}
