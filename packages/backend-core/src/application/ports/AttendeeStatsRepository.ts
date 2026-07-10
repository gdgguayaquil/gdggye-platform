import type { AttendeeStats } from "../../domain/entities/Badge";

export interface AttendeeStatsRepository {
  // Current tallies for one user at one event, keyed by badge criteria type:
  // points_total (registrations.total_points), the accepted-scan counts by
  // target_type, and precheckin_approved (1 if approved else 0).
  getStats(userId: string, eventId: string): Promise<AttendeeStats>;
}
