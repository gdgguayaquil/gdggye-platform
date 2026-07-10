import type {
  AttendeeStats,
  AttendeeStatsRepository,
} from "@gdggye/backend-core";

import type { SupabaseServerClient } from "../client/createServerClient";
import type { SupabaseServiceClient } from "../client/createServiceClient";
import type { AnySupabaseClient } from "../client/types";

// Assembles the tallies badge criteria are checked against. Two reads: the
// registration (points_total + precheckin_approved) and the accepted scan_logs
// (counted by target_type). scan_logs.target_type 'attendee' IS the networking
// count — networking scans target another attendee.
export class SupabaseAttendeeStatsRepository implements AttendeeStatsRepository {
  private readonly client: AnySupabaseClient;
  constructor(client: SupabaseServiceClient | SupabaseServerClient) {
    this.client = client as AnySupabaseClient;
  }

  async getStats(userId: string, eventId: string): Promise<AttendeeStats> {
    const [regRes, scanRes] = await Promise.all([
      this.client
        .from("registrations")
        .select("total_points, pre_checkin_status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle(),
      this.client
        .from("scan_logs")
        .select("target_type")
        .eq("event_id", eventId)
        .eq("scanner_user_id", userId)
        .eq("result", "accepted"),
    ]);
    if (regRes.error)
      throw new Error(
        `SupabaseAttendeeStatsRepository.getStats (registration): ${regRes.error.message}`,
      );
    if (scanRes.error)
      throw new Error(
        `SupabaseAttendeeStatsRepository.getStats (scans): ${scanRes.error.message}`,
      );

    const stats: AttendeeStats = {
      points_total: regRes.data?.total_points ?? 0,
      sponsor_scans: 0,
      activity_scans: 0,
      networking_scans: 0,
      precheckin_approved:
        regRes.data?.pre_checkin_status === "approved" ? 1 : 0,
    };
    for (const row of scanRes.data ?? []) {
      if (row.target_type === "sponsor") stats.sponsor_scans += 1;
      else if (row.target_type === "activity") stats.activity_scans += 1;
      else if (row.target_type === "attendee") stats.networking_scans += 1;
    }
    return stats;
  }
}
