// Leaderboard read models. Both the top-N and "your row" come from
// SECURITY DEFINER RPCs that join registrations + users and expose only
// the public-facing identity (no email, no consents).
//
// rank uses rank() with deterministic tie-break: same points →
// earlier-registered attendee ranks higher. That keeps the order stable
// across realtime ticks so the UI doesn't shuffle on every tie.

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  photoUrl: string | null;
  totalPoints: number;
  rank: number;
}

// A point-transaction breakdown by source. Used by the my-stats view to
// show "you earned X from sponsors, Y from activities".
export type PointSource =
  | "sponsor"
  | "activity"
  | "networking"
  | "bonus"
  | "admin_adjustment";

export interface PointBreakdownItem {
  source: PointSource;
  total: number;
  count: number;
}

// A single point_transactions row, as the admin ledger shows it (newest
// first). Unlike PointBreakdownItem this is the un-aggregated line item —
// the admin attendee drawer needs to see each grant, not just the totals.
export interface PointLedgerEntry {
  id: string;
  eventId: string;
  userId: string;
  source: PointSource;
  sourceId: string | null;
  points: number; // signed; negative for corrective admin_adjustment rows
  createdAt: Date;
}

export interface MyEventStats {
  eventId: string;
  userId: string;
  totalPoints: number;
  rank: number | null;
  breakdown: PointBreakdownItem[];
}
