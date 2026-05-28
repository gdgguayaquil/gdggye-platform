// Domain entity: Registration
// One row per (event, user). Tracks pre-checkin status (Phase 3) and the
// denormalized total_points (kept in sync by the apply_point_transaction
// DB trigger — see migration 0002).

export type PreCheckinStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  preCheckinStatus: PreCheckinStatus;
  approvedAt: Date | null;
  totalPoints: number;
  eventRank: number | null;
  createdAt: Date;
}
